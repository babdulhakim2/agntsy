import { NextRequest, NextResponse } from 'next/server'
import { MOCK_ANALYSIS } from '@/lib/mock-discover'
import { storeAnalysis } from '@/lib/redis-client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const businessId = body.businessId || body.business_id
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
    }

    // TODO: Real Claude analysis when ANTHROPIC_API_KEY is set
    const analysis = {
      ...MOCK_ANALYSIS,
      businessId,
    }
    await storeAnalysis(businessId, analysis)

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
