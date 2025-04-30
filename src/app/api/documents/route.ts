import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

export async function GET(req: NextRequest) {
  const client = new MongoClient(process.env.MONGODB_URI as string);
  
  // Get pagination parameters from URL
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const orgId = url.searchParams.get('orgId') || '';
  
  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  try {
    await client.connect();
    const db = client.db("asssignment_final");
    const collection = db.collection("asssignment_collection");
    
    // Create filter object
    const filter = orgId ? { org_Id: orgId } : {};
    
    // Get total count for pagination
    const totalCount = await collection.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Fetch documents with pagination
    const documents = await collection.find(filter)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return NextResponse.json({
      documents,
      count: documents.length,
      totalCount,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch documents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}