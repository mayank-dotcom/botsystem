import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/dbconfig/dbconfig";
import { ObjectId } from "mongodb";

interface Connections {
    org_Id: string;
    name: string;
    url?: string;
    imageUrl?: string;
    databases?: string[]; // Changed from database to databases array
    createdAt?: Date;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { org_Id, name, imageUrl, databases, useCustomPrompt, customPrompt, botBehavior } = body;

    if (!org_Id || !name) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('asssignment_final');

    // Save connection to connections collection without URL initially
    const connection = {
      org_Id,
      name,
      imageUrl,
      databases,
      useCustomPrompt,
      customPrompt,
      botBehavior,
      createdAt: new Date(),
    };

    console.log('Saving connection:', connection);
    
    const result = await db.collection('connections').insertOne(connection);
    const insertedId = result.insertedId.toString();

    // Update the connection with its own ID as the URL
    await db.collection('connections').updateOne(
      { _id: result.insertedId },
      { $set: { url: insertedId } }
    );

    // If databases are selected, update each dataset document with the URL (which is now the object ID)
    if (databases && databases.length > 0) {
      const updatePromises = databases.map((database: string) => 
        db.collection('asssignment_collection').updateOne(
          { content: database },
          { $set: { url: insertedId } }
        )
      );
      
      await Promise.all(updatePromises);
    }

    console.log('Connection saved with ID:', insertedId);

    return NextResponse.json({ success: true, insertedId: insertedId });
  } catch (error) {
    console.error('Error saving connection:', error);
    return NextResponse.json({ success: false, message: 'Failed to save connection' }, { status: 500 });
  }
}