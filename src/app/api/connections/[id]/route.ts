import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/dbconfig/dbconfig";
import { ObjectId } from "mongodb";
import { getDatafromtoken } from "@/helpers/getDatafromtoken";

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        
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

// Updated GET handler to fetch a specific connection with org_Id check
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        
        if (!id) {
            return NextResponse.json({ 
                success: false, 
                message: "Connection ID is required" 
            }, { status: 400 });
        }
        
        // Get the user ID from token
        const userId = getDatafromtoken(req);
        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                message: "Unauthorized" 
            }, { status: 401 });
        }
        
        const client = await clientPromise;
        const db = client.db("asssignment_final");
        
        // First, get the user's organization ID
        const orgCollection = db.collection("org_collection");
        const org = await orgCollection.findOne({ _id: new ObjectId(userId) });
        
        if (!org) {
            return NextResponse.json({ 
                success: false, 
                message: "Organization not found" 
            }, { status: 404 });
        }
        
        const orgId = org.org_Id;
        
        // Now fetch the connection with org_Id check
        const collection = db.collection("connections");
        const connection = await collection.findOne({ 
            _id: new ObjectId(id),
            org_Id: orgId  // Only return connections that match the user's org_Id
        });
        
        if (!connection) {
            return NextResponse.json({ 
                success: false, 
                message: "Connection not found or you don't have access to it" 
            }, { status: 404 });
        }
        
        return NextResponse.json({ 
            success: true, 
            connection
        });
    } catch (error) {
        console.log(`api/connections/${params.id} GET failed`, error);
        return NextResponse.json({ 
            success: false, 
            message: "Failed to fetch connection" 
        }, { status: 500 });
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

    // Get the connection first to get the databases
    const connection = await db.collection("connections").findOne({
      _id: new ObjectId(id)
    });

    if (!connection) {
      return NextResponse.json(
        { success: false, message: "Connection not found" },
        { status: 404 }
      );
    }

    // If this connection has databases, remove the URL from each dataset
    if (connection.databases && connection.databases.length > 0) {
      const updatePromises = connection.databases.map((database: string) => 
        db.collection("asssignment_collection").updateOne(
          { content: database },
          { $unset: { url: "" } }
        )
      );
      
      await Promise.all(updatePromises);
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