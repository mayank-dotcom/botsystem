import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/dbconfig/dbconfig";

interface Connections {
    org_Id: string;
    name: string;
    url: string;
    imageUrl?: string;
    database?: string;
    createdAt?: Date;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { org_Id, name, url, imageUrl, database, useCustomPrompt, customPrompt, botBehavior } = body;

    if (!org_Id || !name || !url) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('asssignment_final');

    // Save connection to connections collection
    const connection = {
      org_Id,
      name,
      url,
      imageUrl,
      database,
      useCustomPrompt,
      customPrompt,
      botBehavior,
      createdAt: new Date(),
    };

    console.log('Saving connection:', connection);
    
    const result = await db.collection('connections').insertOne(connection);

    // If database is selected, update the dataset document with the URL
    if (database) {
      await db.collection('asssignment_collection').updateOne(
        { content: database },
        { $set: { url: url } }
      );
    }

    console.log('Connection saved with ID:', result.insertedId);

    return NextResponse.json({ success: true, insertedId: result.insertedId });
  } catch (error) {
    console.error('Error saving connection:', error);
    return NextResponse.json({ success: false, message: 'Failed to save connection' }, { status: 500 });
  }
}