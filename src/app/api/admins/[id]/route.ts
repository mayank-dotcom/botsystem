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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    
    const adminId = params.id;
    
    // Validate the admin ID
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid admin ID" 
      }, { status: 400 });
    }
    
    // Find the admin by ID
    const admin = await Org.findById(adminId);
    
    if (!admin) {
      return NextResponse.json({ 
        success: false, 
        message: "Admin not found" 
      }, { status: 404 });
    }
    
    // Delete the admin
    await Org.findByIdAndDelete(adminId);
    
    return NextResponse.json({ 
      success: true, 
      message: "Admin removed successfully" 
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("Error removing admin:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to remove admin" 
    }, { status: 500 });
  }
}