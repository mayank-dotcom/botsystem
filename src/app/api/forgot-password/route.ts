import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import Org from "@/models/orgModel";
import { sendEmail } from "@/helpers/mailer";
import mongoose from "mongoose";

const connect = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    await mongoose.connect(uri);
  } catch (error) {
    console.log('Error connecting to MongoDB:', error);
    throw new Error('Connection failed');
  }
};

export async function POST(request: NextRequest) {
  try {
    await connect();
    
    const reqBody = await request.json();
    const { email } = reqBody;
    
    // First check if it's an organization email
    const org = await Org.findOne({ super_email: email });
    if (org) {
      // Pass isOrg: true for organization accounts
      await sendEmail({ email, emailType: "RESET", userId: org._id, isOrg: true });
      return NextResponse.json({ 
        message: "Password reset email sent successfully" 
      }, { status: 200 });
    }

    // If not an organization, check regular user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }
    
    // For regular users, isOrg is false (default)
    await sendEmail({ email, emailType: "RESET", userId: user._id });
    
    return NextResponse.json({ 
      message: "Password reset email sent successfully" 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Password reset request failed:", error);
    return NextResponse.json({ 
      error: "Failed to process password reset request" 
    }, { status: 500 });
  }
}