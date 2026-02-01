import { NextRequest, NextResponse } from 'next/server'
import { discoverBusiness } from '@/lib/browserbase'
import { generateBusinessProfile } from '@/lib/task-engine'
import { storeBusiness, storeAnalysis } from '@/lib/redis-client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const mapsUrl = body.mapsUrl || body.maps_url || body.url
    if (!mapsUrl) {
      return NextResponse.json({ error: 'Google Maps URL is required' }, { status: 400 })
    }

    // Phase 1: Discover business via Browserbase
    console.log('[Agent] Starting discovery:', mapsUrl)
    const discovery = await discoverBusiness(mapsUrl)
    const { business, browserbaseSessionId, browserbaseSessionUrl } = discovery
    await storeBusiness(business.id, business)

    console.log(`[Agent] Discovered: "${business.name}" - ${business.reviews.length} reviews`)

    // Phase 2: Generate tasks with eval harnesses (Weave-traced)
    console.log('[Agent] Generating tasks...')
    const profile = await generateBusinessProfile(business, browserbaseSessionId, browserbaseSessionUrl)
    await storeAnalysis(business.id, profile)

    console.log(`[Agent] Generated ${profile.tasks.length} tasks for "${business.name}"`)

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('[Agent] Error:', error)
    return NextResponse.json({ error: 'Agent failed' }, { status: 500 })
  }
}
