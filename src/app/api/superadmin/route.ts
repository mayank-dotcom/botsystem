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
    const { org_name, org_Id, super_email, password, isSuper = true } = reqBody;
    
    // Check if super admin with this email already exists
    const existingAdmin = await Org.findOne({ super_email });
    if (existingAdmin) {
      return NextResponse.json({ 
        success: false,
        message: "Super admin with this email already exists" 
      }, { status: 400 });
    }
    
    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    
    // Create a new super admin
    const newSuperAdmin = new Org({
      org_name,
      org_Id,
      super_email,
      super_password: hashedPassword,
      isSuper: true,
      isVerified: false
    });
    
    // Save the super admin to the database
    const savedSuperAdmin = await newSuperAdmin.save();
    
    // Send verification email
    await sendEmail({
      email: super_email,
      emailType: "VERIFY",
      userId: savedSuperAdmin._id,
      isOrg: true
    });
    
    return NextResponse.json({
      success: true,
      message: "Super admin created successfully. Verification email sent.",
      admin: {
        _id: savedSuperAdmin._id,
        org_name: savedSuperAdmin.org_name,
        super_email: savedSuperAdmin.super_email,
        isSuper: savedSuperAdmin.isSuper
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("Error creating super admin:", error);
    return NextResponse.json({ 
      success: false,
      message: error.message || "Failed to create super admin" 
    }, { status: 500 });
  }
}