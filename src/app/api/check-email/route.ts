import User from '@/models/userModel';
import { NextRequest, NextResponse } from 'next/server';

import mongoose from 'mongoose'
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
    const { email } = reqBody;

    const user = await User.findOne({ email });
    if (user) {
      return NextResponse.json({ exists: true });
    } else {
      return NextResponse.json({ exists: false });
    }
  } catch (error) {
    console.error("Error in check-email API:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}