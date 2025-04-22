import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/dbconfig/dbconfig";

// GET all connections for an organization
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const orgId = searchParams.get('orgId');
        
        if (!orgId) {
            return NextResponse.json({ 
                success: false, 
                message: "Organization ID is required" 
            }, { status: 400 });
        }
        
        const client = await clientPromise;
        const db = client.db("asssignment_final");
        const collection = db.collection("connections");
        
        const connections = await collection.find({ org_Id: orgId }).toArray();
        
        return NextResponse.json({ 
            success: true, 
            connections
        });
    } catch (error) {
        console.log("api/connections GET failed", error);
        return NextResponse.json({ 
            success: false, 
            message: "Failed to fetch connections" 
        }, { status: 500 });
    }
}