import { NextRequest, NextResponse } from 'next/server';
import { analyzeBusiness } from '@/lib/analysis';
import { getBusiness, storeAnalysis, storeWorkflows } from '@/lib/redis-client';
import { BusinessInfo } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { business_id, business_data } = body;

    let business: BusinessInfo | null = null;

    // Try to get from Redis first, then fall back to passed data
    if (business_id) {
      business = await getBusiness(business_id);
    }

    if (!business && business_data) {
      business = business_data as BusinessInfo;
    }

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found. Provide business_id or business_data.' },
        { status: 404 }
      );
    }

    const analysis = await analyzeBusiness(business);

    // Store analysis and workflows
    await storeAnalysis(analysis);
    if (analysis.suggested_workflows.length > 0) {
      await storeWorkflows(business.id, analysis.suggested_workflows);
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: String(error) },
      { status: 500 }
    );
  }
}
