import { NextRequest, NextResponse } from "next/server";
import Org from "@/models/orgModel";
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

export async function GET(request: NextRequest) {
  try {
    await connect();
    
    // Get all admins from the org_collection
    const admins = await Org.find({});
    
    return NextResponse.json({
      success: true,
      admins
    });
    
  } catch (error: any) {
    console.error("Error fetching admins:", error);
    return NextResponse.json({ 
      success: false,
      message: error.message || "Failed to fetch admins" 
    }, { status: 500 });
  }
}