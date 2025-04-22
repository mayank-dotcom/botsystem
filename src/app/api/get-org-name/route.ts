import { NextRequest, NextResponse } from 'next/server';
import { getDatafromtoken } from "@/helpers/getDatafromtoken";
import Org from "@/models/orgModel";
import { connect } from "@/dbconfig/dbconfig";

export async function GET(request: NextRequest) {
    try {
        // 1. Connect to database
        await connect();

        // 2. Get user ID from token
        const userId = getDatafromtoken(request);

        // 3. Find organization by user ID (assuming userId is the _id of the org)
        const org = await Org.findById(userId).select('org_name');
        
        if (!org) {
            return NextResponse.json({
                success: false,
                message: "Organization not found"
            }, { status: 404 });
        }

        // 4. Return organization name
        return NextResponse.json({
            success: true,
            org_name: org.org_name
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}