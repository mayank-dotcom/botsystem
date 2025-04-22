import { NextRequest, NextResponse } from 'next/server';
import { getDatafromtoken } from "@/helpers/getDatafromtoken"
export async function GET(request: NextRequest) {
    try {
        const userId = getDatafromtoken(request);
        return NextResponse.json({
            success: true,
            userId
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 401 });
    }
}