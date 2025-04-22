import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import bcryptjs from "bcryptjs";
import { getDatafromtoken } from "@/helpers/getDatafromtoken";
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
    
    // Get user ID from token
    const userId = await getDatafromtoken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const reqBody = await request.json();
    const { currentPassword, newPassword } = reqBody;
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Verify current password
    const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    
    // Hash the new password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);
    
    // Update user's password
    user.password = hashedPassword;
    await user.save();
    
    return NextResponse.json({ 
      message: "Password changed successfully" 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Password change failed:", error);
    return NextResponse.json({ 
      error: "Failed to change password" 
    }, { status: 500 });
  }
}