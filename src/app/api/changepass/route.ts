import User from "@/models/userModel";
import Org from "@/models/orgModel";
import bcryptjs from 'bcryptjs'
import {sendEmail} from '@/helpers/mailer'
import { NextResponse, NextRequest } from "next/server";
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

export async function POST(request:NextRequest){
try {
    await connect();
    const reqBody = await request.json()
    const {email, password} = reqBody
    
    // Hash the new password
    const salt = await bcryptjs.genSalt(10)
    const hashedPassword = await bcryptjs.hash(password, salt)
    
    // Check both User and Org collections
    const user = await User.findOne({email: email})
    const org = await Org.findOne({super_email: email})
    
    if (user) {
        // Update user password and tokens
        const updatedUser = await User.findOneAndUpdate(
            {email: email},
            {
                password: hashedPassword,
                forgotPasswordToken: undefined,
                forgotPasswordTokenExpiry: undefined
            },
            {new: true}
        )
        await sendEmail({email, emailType: "RESET", userId: user._id})
        return NextResponse.json({message: "User password reset and email sent"})
    } 
    else if (org) {
        // Update organization password and tokens
        const updatedOrg = await Org.findOneAndUpdate(
            {super_email: email},
            {
                super_password: hashedPassword,
                forgotPasswordToken: undefined,
                forgotPasswordTokenExpiry: undefined
            },
            {new: true}
        )
        await sendEmail({email, emailType: "RESET", userId: org._id, isOrg: true})
        return NextResponse.json({message: "Organization password reset and email sent"})
    }
    
    return NextResponse.json({error: "No user or organization found with this email"}, {status: 404})
    
} catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json({error: "Error processing password change"}, {status: 500})
}
}