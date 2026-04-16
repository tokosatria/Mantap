import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, pagePath, pageTitle, deviceType, city, country, referrer } = body;

    // Validate required fields
    if (!sessionId || !pagePath) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sessionId, pagePath' },
        { status: 400 }
      );
    }

    // Get user's IP for location (basic)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Store analytics data
    await db.analytics.create({
      data: {
        sessionId,
        pagePath,
        pageTitle: pageTitle || null,
        deviceType: deviceType || 'desktop',
        city: city || null,
        country: country || null,
        referrer: referrer || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    
    // Check if error is about missing table
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { success: false, error: 'Analytics table does not exist. Please run database migration.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}

// Get analytics data (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'today'; // today, week, month, all

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Get all analytics data for the period
    const analyticsData = await db.analytics.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate metrics
    const pageViews = analyticsData.length;
    const uniqueVisitors = new Set(analyticsData.map((a) => a.sessionId)).size;

    // Device type breakdown
    const deviceBreakdown = analyticsData.reduce((acc: any, curr) => {
      acc[curr.deviceType] = (acc[curr.deviceType] || 0) + 1;
      return acc;
    }, {});

    // Page visits breakdown
    const pageVisits = analyticsData.reduce((acc: any, curr) => {
      acc[curr.pagePath] = (acc[curr.pagePath] || 0) +1;
      return acc;
    }, {});

    // Location breakdown
    const locationBreakdown = analyticsData
      .filter((a) => a.city)
      .reduce((acc: any, curr) => {
        const key = `${curr.city}, ${curr.country || ''}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

    return NextResponse.json({
      success: true,
      data: {
        period,
        pageViews,
        uniqueVisitors,
        deviceBreakdown,
        pageVisits,
        locationBreakdown,
        recentVisits: analyticsData.slice(0, 50),
      },
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    
    // Check if error is about missing table
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { success: false, error: 'Analytics table does not exist. Please run database migration.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}
