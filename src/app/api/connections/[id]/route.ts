import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/dbconfig/dbconfig";
import { ObjectId } from "mongodb";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, url, imageUrl, database, useCustomPrompt, customPrompt, botBehavior } = body;

    if (!name || !url) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('asssignment_final');

    const updateData = {
      name,
      url,
      imageUrl,
      database,
      useCustomPrompt,
      customPrompt,
      botBehavior,
      updatedAt: new Date(),
    };

    const result = await db.collection('connections').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Connection not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating connection:', error);
    return NextResponse.json({ success: false, message: 'Failed to update connection' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Connection ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("asssignment_final");

    // Get the connection first to get the database name
    const connection = await db.collection("connections").findOne({
      _id: new ObjectId(id)
    });

    if (!connection) {
      return NextResponse.json(
        { success: false, message: "Connection not found" },
        { status: 404 }
      );
    }

    // If this connection has a database, remove the URL from asssignment_collection
    if (connection.database) {
      await db.collection("asssignment_collection").updateOne(
        { content: connection.database },
        { $unset: { url: "" } }
      );
    }

    // Delete the connection
    const result = await db.collection("connections").deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Connection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting connection:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete connection" },
      { status: 500 }
    );
  }
}