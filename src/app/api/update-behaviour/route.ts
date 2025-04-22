import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/dbconfig/dbconfig";

interface BehaviourHistory {
    length_var: string;
    outputStructure_var: string;
    tone_var: string;
    personality_var: string;
    do_var: string;
    don_var: string;
    org_Id: string;
}

export async function PUT(req: NextRequest) {
    try {
        const { length, outputStructure, tone, personality, mustdo, dondo, orgId } = await req.json();
        
        console.log('Update request data:', { length, outputStructure, tone, personality, mustdo, dondo, orgId });
        
        if (!length || !outputStructure || !tone || !personality || !mustdo || !dondo || !orgId) {
            console.log("Missing fields in update request");
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        try {
            const client = await clientPromise;
            const db = client.db("asssignment_final");
            const collection = db.collection<BehaviourHistory>("behaviour_history");
            
            // Check if document exists before updating
            const existingBehaviour = await collection.findOne({ org_Id: orgId });
            
            if (!existingBehaviour) {
                console.log('No behaviour found for this organization');
                return NextResponse.json({ 
                    message: "No behaviour found for this organization",
                }, { status: 404 });
            }
            
            // Update the existing document
            const result = await collection.updateOne(
                { org_Id: orgId },
                { 
                    $set: {
                        length_var: length,
                        outputStructure_var: outputStructure,
                        tone_var: tone,
                        personality_var: personality,
                        do_var: mustdo,
                        don_var: dondo
                    }
                }
            );
            
            if (result.modifiedCount === 1) {
                console.log('Behaviour updated successfully');
                return NextResponse.json({ 
                    message: "Behaviour updated successfully",
                    modifiedCount: result.modifiedCount
                }, { status: 200 });
            } else {
                console.log('Behaviour update failed');
                return NextResponse.json({ 
                    message: "Behaviour update failed",
                    modifiedCount: result.modifiedCount
                }, { status: 500 });
            }
            
        } catch (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json({ error: "Database operation failed" }, { status: 500 });
        }
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}