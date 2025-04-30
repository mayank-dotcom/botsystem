


import clientPromise from "@/dbconfig/dbconfig";
import { NextRequest, NextResponse } from "next/server";

interface ConversationHistory {
    userId: string;
    question: string;
    response: string;
    timestamp: Date;
    org_Id?: string;
    url?: string;
}

export async function POST(req: NextRequest) {
    try {
        const { userId, orgId, url } = await req.json();
        const client = await clientPromise;
        const db = client.db("asssignment_final");
        const historyCollection = db.collection<ConversationHistory>("conversation_history");
        
        // Build filter based on provided parameters
        let filter: any = {};
        
        // If url is provided, prioritize filtering by URL
        if (url) {
            filter.url = url;
            console.log("Filtering conversation history by URL:", url);
        }
        // If no URL or as fallback, use orgId or userId
        else if (orgId) {
            filter.org_Id = orgId;
        } else if (userId) {
            filter.userId = userId;
        }
        
        // Fetch all history for the user or organization, sorted by timestamp
        const latestHistory = await historyCollection
            .find(filter)
            .sort({ timestamp: 1 }) // Sort by oldest to newest
            .toArray();
            
        if(latestHistory.length > 0) {
            console.log("History fetched successfully", latestHistory.length, "items");
            return NextResponse.json({ 
                success: true,
                message: "History fetched successfully", 
                latestHistory 
            }, { status: 200 });
        } else {
            console.log("No history found for the given filter", filter);
            return NextResponse.json({ 
                success: true,
                message: "No history found for the given filter",
                latestHistory: []
            }, { status: 200 }); // Return 200 with empty array instead of 404
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

// Add GET method to fetch history with pagination similar to chat-history/route.ts
export async function GET(request: NextRequest) {
    try {
        // Get query parameters
        const url = new URL(request.url);
        const orgId = url.searchParams.get('orgId');
        const embedUrl = url.searchParams.get('url'); // Add URL parameter
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        // Build filter based on provided parameters
        let filter: any = {};
        
        // If embedUrl is provided, prioritize filtering by URL
        if (embedUrl) {
            filter.url = embedUrl;
            console.log("Filtering conversation history by URL:", embedUrl);
        } 
        // If no URL or as fallback, use orgId
        else if (orgId) {
            filter.org_Id = orgId;
            console.log("Filtering conversation history by orgId:", orgId);
        } else {
            return NextResponse.json({ 
                success: false, 
                message: "Either Organization ID or URL is required" 
            }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("asssignment_final");
        const historyCollection = db.collection("conversation_history");
        const connectionsCollection = db.collection("connections");
        
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;
        
        // Get total count for pagination
        const totalCount = await historyCollection.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit);
        
        // Fetch history for the organization, sorted by timestamp
        const history = await historyCollection
            .find(filter)
            .sort({ timestamp: -1 }) // Sort by newest to oldest
            .skip(skip)
            .limit(limit)
            .toArray();
        
        // Fetch all connections to get bot names
        const connections = await connectionsCollection.find({}).toArray();
        const botMap: { [key: string]: string } = {};
        
        // Create a mapping of connection URL to bot name
        connections.forEach(connection => {
            if (connection.url && connection.name) {
                botMap[connection.url as string] = connection.name;
            }
        });
        
        // Add bot names to history items
        const historyWithBotNames = history.map(item => {
            const botName = item.url && item.url in botMap ? botMap[item.url as string] : 'Unknown Bot';
            return {
                ...item,
                botName
            };
        });
            
        if (history.length > 0) {
            console.log("History fetched successfully", history.length, "items");
            return NextResponse.json({ 
                success: true, 
                message: "History fetched successfully", 
                history: historyWithBotNames,
                currentPage: page,
                totalPages,
                totalCount
            }, { status: 200 });
        } else {
            console.log("No history found for the given filter");
            return NextResponse.json({ 
                success: true,
                message: "No history found for the given filter",
                history: [],
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