import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    // Read the embed.js file
    const filePath = path.join(process.cwd(), 'public', 'embed.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Return the JavaScript file with appropriate headers
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (error) {
    console.error('Error serving embed script:', error);
    return NextResponse.json(
      { error: 'Failed to serve embed script' },
      { status: 500 }
    );
  }
}