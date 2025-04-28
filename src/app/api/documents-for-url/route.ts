import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/dbconfig/dbconfig';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("asssignment_final");
    
    // Find documents in assignment_collection that match the URL
    const collection = db.collection("asssignment_collection");
    const documents = await collection.find({ url: url }).toArray();
    
    // Format the documents for the frontend
    const formattedDocuments = documents.map((doc, index) => ({
      id: index + 1, // Use the index+1 as the rank/id
      title: doc.title || `Document ${index + 1}`,
      // You can include other metadata if needed
    }));
    
    // Also fetch behavior settings from connections collection
    const connectionsCollection = db.collection("connections");
    const connection = await connectionsCollection.findOne({ url: url });
    
    return NextResponse.json({
      documents: formattedDocuments,
      behavior: connection?.botBehavior || null
    });
    
  } catch (error) {
    console.error('Error fetching documents for URL:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error.message },
      { status: 500 }
    );
  }
}