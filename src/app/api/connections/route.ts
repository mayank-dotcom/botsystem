import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/dbconfig/dbconfig";
const { ObjectId } = require('mongodb');

export async function GET(request: NextRequest) {
    try {
        // Get the orgId from the query parameters
        const searchParams = request.nextUrl.searchParams;
        const orgId = searchParams.get('orgId');
        
        if (!orgId) {
            return NextResponse.json({ 
                success: false, 
                message: "Organization ID is required" 
            }, { status: 400 });
        }
        
        const client = await clientPromise;
        const db = client.db("asssignment_final");
        const connectionsCollection = db.collection("connections");
        
        // Fetch connections filtered by org_Id
        const connections = await connectionsCollection.find({ org_Id: orgId }).toArray();
            
        return NextResponse.json({ 
            success: true, 
            message: "Connections fetched successfully", 
            connections
        }, { status: 200 });
    } catch (error) {
        console.log("Error in fetching connections ", error);
        return NextResponse.json({ 
            success: false, 
            message: "Error in fetching connections",
            error: String(error)
        }, { status: 500 });
    }
}

// PUT handler to update a connection
export async function PUT(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const id = pathParts[pathParts.length - 1];
        
        if (!id) {
            return NextResponse.json({ 
                success: false, 
                message: "Connection ID is required" 
            }, { status: 400 });
        }
        
        const body = await req.json();
        const { name, imageUrl, databases, useCustomPrompt, customPrompt, botBehavior } = body;
        
        if (!name) {
            return NextResponse.json({ 
                success: false, 
                message: "Name is required" 
            }, { status: 400 });
        }
        
        const client = await clientPromise;
        const db = client.db("asssignment_final");
        
        // Get the current connection to check if databases have changed
        const currentConnection = await db.collection('connections').findOne({ _id: new ObjectId(id) });
        
        if (!currentConnection) {
            return NextResponse.json({ 
                success: false, 
                message: "Connection not found" 
            }, { status: 404 });
        }
        
        // If the connection exists and has databases
        if (currentConnection && currentConnection.databases && currentConnection.databases.length > 0) {
            // Remove URL from datasets that are no longer associated with this connection
            const removedDatabases = currentConnection.databases.filter(
                (db: string) => !databases || !databases.includes(db)
            );
            
            if (removedDatabases.length > 0) {
                const removePromises = removedDatabases.map((database: string) => 
                    db.collection('asssignment_collection').updateOne(
                        { content: database },
                        { $unset: { url: "" } }
                    )
                );
                
                await Promise.all(removePromises);
            }
        }
        
        const updateData = {
            name,
            imageUrl,
            databases,
            useCustomPrompt,
            customPrompt,
            botBehavior,
            updatedAt: new Date(),
        };
        
        const result = await db.collection('connections').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        
        // If new databases are selected, update their URLs
        if (databases && databases.length > 0) {
            const updatePromises = databases.map((database: string) => 
                db.collection('asssignment_collection').updateOne(
                    { content: database },
                    { $set: { url: id } }
                )
            );
            
            await Promise.all(updatePromises);
        }
        
        if (result.matchedCount === 0) {
            return NextResponse.json({ 
                success: false, 
                message: 'Connection not found' 
            }, { status: 404 });
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating connection:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to update connection' 
        }, { status: 500 });
    }
}