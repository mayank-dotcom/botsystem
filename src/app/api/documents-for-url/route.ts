import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/dbconfig/dbconfig';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("asssignment_final");
    
    // First, find the connection by its ID (which is passed as the url parameter)
    const connectionsCollection = db.collection("connections");
    let connection;
    
    try {
      // Try to parse as ObjectId (if it's a valid MongoDB ID)
      connection = await connectionsCollection.findOne({ _id: new ObjectId(url) });
    } catch (e) {
      // If not a valid ObjectId, try as a regular URL string
      connection = await connectionsCollection.findOne({ url: url });
    }
    
    if (!connection) {
      return NextResponse.json({ 
        error: 'Connection not found',
        documents: []
      }, { status: 404 });
    }
    
    // Now get the documents associated with this connection through its databases array
    const collection = db.collection("asssignment_collection");
    let documents: any[] = [];
    
    if (connection.databases && connection.databases.length > 0) {
      // Find documents that match any content in the databases array
      documents = await collection.find({ 
        content: { $in: connection.databases } 
      }).toArray();
    }
    
    // Format the documents for the frontend
    const formattedDocuments = documents.map((doc, index) => ({
      id: index + 1, // Use the index+1 as the rank/id
      title: doc.title || doc.content?.substring(0, 30) || `Document ${index + 1}`,
      // You can include other metadata if needed
    }));
    
    return NextResponse.json({
      documents: formattedDocuments,
      behavior: connection?.botBehavior || null
    });
    
  } catch (error) {
    console.error('Error fetching documents for URL:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}