


import clientPromise from "@/dbconfig/dbconfig";
import { NextRequest, NextResponse } from "next/server";

interface ConversationHistory {
    userId: string;
    question: string;
    response: string;
    timestamp: Date;
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        const client = await clientPromise;
        const db = client.db("asssignment_final");
        const historyCollection = db.collection<ConversationHistory>("conversation_history");
        
        // Fetch all history for the user, sorted by timestamp
        const latestHistory = await historyCollection
            .find({ userId })
            .sort({ timestamp: 1 }) // Sort by oldest to newest
            .toArray();
            
        if(latestHistory.length > 0) {
            console.log("History fetched successfully", latestHistory.length, "items");
            return NextResponse.json({ 
                message: "History fetched successfully", 
                latestHistory 
            }, { status: 200 });
        } else {
            console.log("No history found for the given userId")
            return NextResponse.json({ 
                message: "No history found for the given userId",
                latestHistory: []
            }, { status: 200 }); // Return 200 with empty array instead of 404
        }
    } catch (error) {
        console.log("Error in fetching history ", error)
        return NextResponse.json({ 
            message: "Error in fetching history",
            error: String(error)
        }, { status: 500 });
    }
}