import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/dbconfig/dbconfig";

export async function GET(request: NextRequest) {
    try {
        // Get query parameters
        const url = new URL(request.url);
        const orgId = url.searchParams.get('orgId');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        if (!orgId) {
            return NextResponse.json({ 
                success: false, 
                message: "Organization ID is required" 
            }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("asssignment_final");
        const historyCollection = db.collection("conversation_history");
        const connectionsCollection = db.collection("connections");
        
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;
        
        // Get total count for pagination
        const totalCount = await historyCollection.countDocuments({ org_Id: orgId });
        const totalPages = Math.ceil(totalCount / limit);
        
        // Fetch history for the organization, sorted by timestamp
        const history = await historyCollection
            .find({ org_Id: orgId })
            .sort({ timestamp: -1 }) // Sort by newest to oldest
            .skip(skip)
            .limit(limit)
            .toArray();
            
        // Fetch all bots associated with this organization
        const allBots = await connectionsCollection
            .find({ org_Id: orgId })
            .project({ _id: 1, name: 1, url: 1 })
            .toArray();
            
        if (history.length > 0 || allBots.length > 0) {
            console.log("History fetched successfully", history.length, "items");
            console.log("Bots fetched successfully", allBots.length, "bots");
            return NextResponse.json({ 
                success: true, 
                message: "History fetched successfully", 
                history,
                allBots, // Include all bots in the response
                currentPage: page,
                totalPages,
                totalCount
            }, { status: 200 });
        } else {
            console.log("No history found for the given organization ID");
            return NextResponse.json({ 
                success: true,
                message: "No history found for the given organization ID",
                history: [],
                allBots: [],
                currentPage: page,
                totalPages: 0,
                totalCount: 0
            }, { status: 200 });
        }
    } catch (error) {
        console.log("Error in fetching history ", error);
        return NextResponse.json({ 
            success: false, 
            message: "Error in fetching history",
            error: String(error)
        }, { status: 500 });
    }
}