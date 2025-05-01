import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/dbConnect';
import mongoose from 'mongoose';

// Define the activity log schema with a version number
const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  adminId: { type: String, required: true },
  adminName: { type: String, required: false }, // Changed from required: true to false
  adminEmail: { type: String, required: false }, // Added email as an alternative
  adminDesignation: { type: String, required: true, enum: ['admin', 'super admin'] },
  orgId: { type: String, required: true },
  collectionType: { type: String, required: true, enum: ['assignment_collection', 'connections', 'conversation_history'] },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
  schemaVersion: { type: Number, default: 2 } // Add a version number
});

// Force Mongoose to use a new model name to avoid caching issues
const ActivityLog = mongoose.models.ActivityLogV2 || mongoose.model('ActivityLogV2', activityLogSchema);

// POST handler to create a new activity log
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['action', 'adminId', 'adminDesignation', 'orgId', 'collectionType']; // Removed adminName
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ success: false, message: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    
    // Ensure at least one identifier is present (name or email)
    if (!data.adminName && !data.adminEmail) {
      return NextResponse.json({ 
        success: false, 
        message: "Either adminName or adminEmail must be provided" 
      }, { status: 400 });
    }
    
    // Add schema version
    data.schemaVersion = 2;
    
    const activityLog = await ActivityLog.create(data);
    return NextResponse.json({ success: true, data: activityLog }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating activity log:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// GET handler to retrieve activity logs
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json({ success: false, message: 'Organization ID is required' }, { status: 400 });
    }
    
    // Get the limit parameter or default to 10
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Query logs for the specified organization, sorted by timestamp (newest first)
    const logs = await ActivityLog.find({ orgId })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    return NextResponse.json({ success: true, data: logs }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
