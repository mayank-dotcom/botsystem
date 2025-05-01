import { NextRequest, NextResponse } from 'next/server';
import { getDatafromtoken } from "@/helpers/getDatafromtoken";
import Org from "@/models/orgModel";
import User from "@/models/userModel";
import { connect } from "@/dbconfig/dbconfig";

export async function GET(request: NextRequest) {
    try {
        // 1. Connect to database
        await connect();

        // 2. Get user ID from token
        const userId = getDatafromtoken(request);

        // 3. Find organization by user ID
        const org = await Org.findById(userId).select('org_name org_Id super_email isSuper');
        
        if (!org) {
            return NextResponse.json({
                success: false,
                message: "Organization not found"
            }, { status: 404 });
        }

        // 4. Return organization and user details
        return NextResponse.json({
            success: true,
            orgId: org.org_Id,
            org_name: org.org_name,
            adminEmail: org.super_email,
            adminDesignation: org.isSuper ? 'super admin' : 'admin'
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}