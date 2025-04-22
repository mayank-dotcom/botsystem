import { NextRequest,NextResponse } from "next/server";
import clientPromise from "@/dbconfig/dbconfig";
interface BehaviourHistory {
    // _id: string;
    // bot_behaviour: string; 
    length_var:string;
    outputStructure_var:string;
    tone_var:string;
    personality_var:string;
    do_var:string;
    don_var:string;
    org_Id:string;
}
export async function POST(req: NextRequest) {
    try {
        const { length, outputStructure, tone, personality, mustdo, dondo, orgId } = await req.json();
        
        // Add validation logging
        console.log('Received data:', { length, outputStructure, tone, personality, mustdo, dondo, orgId });
        
        if (!length || !outputStructure || !tone || !personality || !mustdo || !dondo || !orgId) {
            console.log("Missing fields:", {
                length: !length,
                outputStructure: !outputStructure,
                tone: !tone,
                personality: !personality,
                mustdo: !mustdo,
                dondo: !dondo,
                orgId: !orgId
            });
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        try {
            const client = await clientPromise;
            const db = client.db("asssignment_final");
            const collection = db.collection<BehaviourHistory>("behaviour_history");
            
            // Check if document with orgId already exists
            const existingBehaviour = await collection.findOne({ org_Id: orgId });
            
            if (existingBehaviour) {
                console.log('Behaviour already exists for this organization');
                return NextResponse.json({ 
                    message: "Behaviour already exists for this organization",
                    existingId: existingBehaviour._id
                }, { status: 200 });
            }
            
            // If no existing document, proceed with insertion
            console.log('Attempting to insert document');
            
            const result = await collection.insertOne({
                length_var: length,
                outputStructure_var: outputStructure,
                tone_var: tone,
                personality_var: personality,
                do_var: mustdo,
                don_var: dondo,
                org_Id: orgId
            });
            
            console.log('Insertion successful, document ID:', result.insertedId);
            
            return NextResponse.json({ 
                message: "Behaviour created successfully",
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