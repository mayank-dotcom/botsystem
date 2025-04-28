import { NextRequest, NextResponse } from "next/server";
import Org from "@/models/orgModel";
import bcryptjs from "bcryptjs";
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
    const { org_name, org_Id, email, password } = reqBody;
    
    // Check if regular admin with this email already exists
    const existingAdmin = await Org.findOne({ super_email: email });
    if (existingAdmin) {
      return NextResponse.json({ 
        success: false,
        message: "Admin with this email already exists" 
      }, { status: 400 });
    }
    
    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    
    // Create a new regular admin
    const newAdmin = new Org({
      org_name,
      org_Id,
      super_email: email,
      super_password: hashedPassword,
      isSuper: false,
      isVerified: false
    });
    
    // Save the regular admin to the database
    const savedAdmin = await newAdmin.save();
    
    // Send verification email
    await sendEmail({
      email,
      emailType: "VERIFY",
      userId: savedAdmin._id,
      isOrg: true
    });
    
    return NextResponse.json({
      success: true,
      message: "Regular admin created successfully. Verification email sent.",
      admin: {
        _id: savedAdmin._id,
        org_name: savedAdmin.org_name,
        email: savedAdmin.super_email,
        isSuper: savedAdmin.isSuper
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("Error creating regular admin:", error);
    return NextResponse.json({ 
      success: false,
      message: error.message || "Failed to create regular admin" 
    }, { status: 500 });
  }
}