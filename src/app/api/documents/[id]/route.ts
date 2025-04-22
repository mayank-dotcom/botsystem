import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const client = new MongoClient(process.env.MONGODB_URI as string);

  try {
    await client.connect();
    const db = client.db("asssignment_final");
    const collection = db.collection("asssignment_collection");
    
    // Delete the document with the given ID
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid document ID format" },
        { status: 400 }
      );
    }
    
    const result = await collection.deleteOne({ _id: objectId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: "Document deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      {
        error: "Failed to delete document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}