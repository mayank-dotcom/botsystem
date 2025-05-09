import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/dbconfig/dbconfig";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ success: false, message: 'Organization ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('asssignment_final');

    // Fetch datasets with their URL information
    const datasets = await db.collection('asssignment_collection')
      .find({ org_Id: orgId })
      .project({ _id: 1, content: 1, org_Id: 1, url: 1 })
      .toArray();

    return NextResponse.json({ success: true, datasets });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch datasets' }, { status: 500 });
  }
}