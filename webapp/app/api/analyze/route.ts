import { NextRequest, NextResponse } from 'next/server'
import { MOCK_ANALYSIS } from '@/lib/mock-discover'
import { storeAnalysis, getBusiness } from '@/lib/redis-client'
import { analyzeBusinessReviews } from '@/lib/analyzer'
import type { BusinessInfo } from '@/lib/discover-types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const businessId = body.businessId || body.business_id
    // Allow passing business data directly (skips Redis lookup)
    const businessData: BusinessInfo | undefined = body.business || body.business_data

    if (!businessId && !businessData) {
      return NextResponse.json({ error: 'businessId or business data is required' }, { status: 400 })
    }

    // Try real AI analysis if we have reviews
    const business = businessData || (businessId ? await getBusiness(businessId) : null)

    if (business && process.env.OPENAI_API_KEY) {
      try {
        console.log(`[Analyze] Running AI analysis on ${business.reviews.length} reviews for "${business.name}"`)
        const analysis = await analyzeBusinessReviews(business)
        if (businessId) await storeAnalysis(businessId, analysis)
        return NextResponse.json({ success: true, analysis })
      } catch (err) {
        console.error('[Analyze] AI analysis failed, falling back to mock:', err)
      }
    }

    // Mock fallback
    console.log('[Analyze] Using mock analysis data')
    const analysis = {
      ...MOCK_ANALYSIS,
      business_id: businessId || 'unknown',
    }
    if (businessId) await storeAnalysis(businessId, analysis)

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
