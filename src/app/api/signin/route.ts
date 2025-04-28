
import clientPromise from '@/dbconfig/dbconfig'
import Org from '@/models/orgModel'
import bcryptjs from 'bcryptjs'
import {sendEmail} from '@/helpers/mailer'
import { NextResponse, NextRequest } from 'next/server'
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

// Call connect function before handling requests
// Add these imports at the top
import crypto from 'crypto';

export async function POST(request: NextRequest){
  try {
    await connect();
    
    const reqBody = await request.json();
    const {username, email, password, org_name} = reqBody;
    
    // Check if organization exists with the same email
    const existingOrgEmail = await Org.findOne({super_email: email}); 
    if(existingOrgEmail){
      return NextResponse.json({message: "Ask your super admin to add you !"}, {status: 400});
    }
    
    // Check if organization exists with the same name
    const existingOrgName = await Org.findOne({org_name: org_name});
    if(existingOrgName){
      return NextResponse.json({message: "Ask your super admin to add you !"}, {status: 400});
    }
    
    // Hashing password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExpiry = new Date();
    verifyTokenExpiry.setHours(verifyTokenExpiry.getHours() + 24); // Token valid for 24 hours

    // Create new organization with verification tokens
    const newOrg = new Org({
      org_name,
      super_email: email,
      super_password: hashedPassword,
      isVerified: false,
      verifyToken: verifyToken,
      verifyTokenExpiry: verifyTokenExpiry,
      forgotPasswordToken: null,
      forgotPasswordTokenExpiry: null
    });
    
    const savedOrg = await newOrg.save();
    savedOrg.org_Id = savedOrg._id.toString();
    await savedOrg.save();
    
    console.log("New Super admin created:", savedOrg);
    
    console.log("New Super admin created:", savedOrg);
    
    // Send verification email with the token
    await sendEmail({
      email, 
      emailType: "VERIFY", 
      userId: savedOrg._id,
      isOrg: true,
      verifyToken: verifyToken  // Pass the token to the email function
    });
 
    return NextResponse.json({message: "Organization created successfully"}, {status: 201});
  } catch (error) {
    console.log(error);
    return NextResponse.json({message: "Error creating organization"}, {status: 500});
  }
}