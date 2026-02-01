import { NextRequest, NextResponse } from 'next/server';
import { discoverBusiness } from '@/lib/browserbase';
import { storeBusiness } from '@/lib/redis-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { maps_url } = body;

    if (!maps_url) {
      return NextResponse.json(
        { error: 'maps_url is required' },
        { status: 400 }
      );
    }

    // Validate it looks like a Google Maps URL (loose check)
    const isValidUrl = maps_url.includes('google.com/maps') ||
      maps_url.includes('maps.google.com') ||
      maps_url.includes('goo.gl/maps') ||
      maps_url.includes('maps.app.goo.gl');

    if (!isValidUrl) {
      // Still allow it for demo — just use mock data
      console.warn('URL does not look like Google Maps, using mock data');
    }

    const business = await discoverBusiness(maps_url);

    // Store in Redis/memory
    await storeBusiness(business);

    return NextResponse.json({
      success: true,
      business,
    });
  } catch (error) {
    console.error('Discovery error:', error);
    return NextResponse.json(
      { error: 'Discovery failed', details: String(error) },
      { status: 500 }
    );
  }
}
