import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

export async function GET(req: NextRequest) {
  const client = new MongoClient(process.env.MONGODB_URI as string);

  try {
    await client.connect();
    const db = client.db("asssignment_final");
    const collection = db.collection("asssignment_collection");
    
    // Fetch all documents from the collection
    const documents = await collection.find({}).toArray();
    
    return NextResponse.json({
      documents,
      count: documents.length
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