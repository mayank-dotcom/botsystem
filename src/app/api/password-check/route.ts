
import User from "@/models/userModel";

import { NextRequest, NextResponse } from "next/server";
import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose'

// Connect to MongoDB using mongoose
const connect = async () => {
  try {
    // Use the MongoDB URI from environment variables
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
    const { password, email } = reqBody;
    
    const person = await User.findOne({ email });
    
    if (!person) {
      return NextResponse.json({ exists: false, message: "User not found" });
    }
    
    const checkPassword = await bcryptjs.compare(password, person.password);
    
    if (checkPassword) {
      return NextResponse.json({ exists: true });
    } else {
      return NextResponse.json({ exists: false, message: "Password incorrect" });
    }
  } catch (error) {
    console.error("Password check error:", error);
    return NextResponse.json({ exists: false, message: "Error occurred while checking for password" });
  }
}