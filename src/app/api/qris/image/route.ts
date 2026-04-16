import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get the active QRIS
    const activeQris = await db.qrisImage.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!activeQris || !activeQris.imageUrl) {
      return NextResponse.json(
        { error: 'No active QRIS found', details: 'No QRIS with isActive=true in database' },
        { status: 404 }
      );
    }

    // Fetch image from Supabase
    const imageResponse = await fetch(activeQris.imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch image from Supabase',
          details: `HTTP ${imageResponse.status}: ${imageResponse.statusText}`,
          url: activeQris.imageUrl
        },
        { status: 500 }
      );
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[QRIS Image Proxy] Error:', error);
    
    // Check if error is about missing table
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: 'QrisImage table does not exist', 
          details: 'Please run database migration to create the table' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
