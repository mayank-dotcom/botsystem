import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import Org from '@/models/orgModel';
import User from '@/models/userModel';
import mongoose from 'mongoose';
import axios from 'axios';

// Connect to MongoDB using mongoose
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
    const { email, password } = reqBody;

    // First check if it's an organization login
    const org = await Org.findOne({ super_email: email }).select('_id super_password isVerified super_email org_name');
    
    if (org) {
      // Verify password for organization
      const validPassword = await bcryptjs.compare(password, org.super_password);
      
      if (!validPassword) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 400 });
      }

      if (!org.isVerified) {
        return NextResponse.json({ error: 'Please verify your email first' }, { status: 400 });
      }

      // Create token
      const tokenData = {
        id: org._id,
        email: org.super_email,
        username: org.org_name,
        isOrg: true,
      };

      const token = jwt.sign(tokenData, process.env.TOKEN_SECRET!, { expiresIn: '1d' });

      // Set cookie
      cookies().set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

     

      return NextResponse.json({
        message: 'Login successful',
        success: true,
      });
    }

    // If not an organization, check regular user
    const user = await User.findOne({ email }).select('_id password isVerified email username');
    console.log('[Login] User lookup result:', { email, userId: user?._id });

    if (!user) {
      return NextResponse.json({ error: 'User does not exist' }, { status: 400 });
    }

    // Verify password for user
    const validPassword = await bcryptjs.compare(password, user.password);

    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ error: 'Please verify your email first' }, { status: 400 });
    }

    // Create token
    const tokenData = {
      id: user._id,
      email: user.email,
      username: user.username,
      isOrg: false,
    };

    const token = jwt.sign(tokenData, process.env.TOKEN_SECRET!, { expiresIn: '1d' });

    // Set cookie
    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({
      message: 'Login successful',
      success: true,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}