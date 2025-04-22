import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import Org from "@/models/orgModel";
import bcryptjs from "bcryptjs";
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
    const { token, password } = reqBody;
    
    // First check if token exists in Org collection
    const org = await Org.findOne({
      forgotPasswordToken: token,
      forgotPasswordTokenExpiry: { $gt: Date.now() }
    });
    
    if (org) {
      // Hash the new password
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);
      
      // Update organization's password and clear reset token fields
      org.super_password = hashedPassword;
      org.forgotPasswordToken = undefined;
      org.forgotPasswordTokenExpiry = undefined;
      
      await org.save();
      
      return NextResponse.json({ 
        message: "Password reset successful" 
      }, { status: 200 });
    }
    
    // If not found in Org collection, check User collection
    const user = await User.findOne({
      forgotPasswordToken: token,
      forgotPasswordTokenExpiry: { $gt: Date.now() }
    }).select('+password +forgotPasswordToken +forgotPasswordTokenExpiry');
    
    if (!user) {
      return NextResponse.json({ 
        error: "Invalid token or token has expired" 
      }, { status: 400 });
    }
    
    // Hash the new password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    
    // Update user's password and clear reset token fields
    user.password = hashedPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;
    
    await user.save();
    
    return NextResponse.json({ 
      message: "Password reset successful" 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Password reset failed:", error);
    return NextResponse.json({ 
      error: "Failed to reset password" 
    }, { status: 500 });
  }
}