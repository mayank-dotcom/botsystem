import { NextRequest,NextResponse } from "next/server";
import clientPromise from "@/dbconfig/dbconfig";
interface orgnameSchema {
    // _id: string;
    // bot_behaviour: string; 
org_name:string;
    org_Id:string;


}
export async function POST(req: NextRequest) {
    try {
        const { name, orgId } = await req.json();
        
        // Add validation logging
        console.log('Received data:', { name, orgId });
        
        if (!name || !orgId) {
            console.log("Missing fields:", {
                name:!name,
                orgId: !orgId
            });
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        try {
            const client = await clientPromise;
            const db = client.db("asssignment_final");
            const collection = db.collection<orgnameSchema>("orgnameSchema");
            
            // Check if document with orgId already exists
            const existingOrganization = await collection.findOne({ org_Id: orgId });
            
            if (existingOrganization) {
                console.log('Organization exists already');
                return NextResponse.json({ 
                    message: "Organization exists already",
                    existingId: existingOrganization._id
                }, { status: 200 });
            }
            
            // If no existing document, proceed with insertion
            console.log('Attempting to insert document');
            
            const result = await collection.insertOne({
                org_name: name,
                org_Id: orgId,
            });
            
            console.log('Insertion successful, document ID:', result.insertedId);
            
            return NextResponse.json({ 
                message: "Organization created successfully",
                insertedId: result.insertedId
            }, { status: 201 });
            
        } catch (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json({ error: "Database operation failed" }, { status: 500 });
        }
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}