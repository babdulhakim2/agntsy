import { NextRequest, NextResponse } from 'next/server'
import { discoverBusiness } from '@/lib/browserbase'
import { storeBusiness } from '@/lib/redis-client'

export async function POST(req: NextRequest) {
  try {
    const { mapsUrl } = await req.json()
    if (!mapsUrl) {
      return NextResponse.json({ error: 'mapsUrl is required' }, { status: 400 })
    }

    const result = await discoverBusiness(mapsUrl)
    await storeBusiness(result.business.id, result)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Discovery error:', error)
    return NextResponse.json({ error: 'Discovery failed' }, { status: 500 })
  }
}
