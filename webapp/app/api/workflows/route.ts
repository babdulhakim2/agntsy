import { NextRequest, NextResponse } from 'next/server'
import { getWorkflows, storeWorkflows } from '@/lib/redis-client'

export async function GET(req: NextRequest) {
  const businessId = new URL(req.url).searchParams.get('businessId')
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })

  const workflows = await getWorkflows(businessId)
  return NextResponse.json({ success: true, workflows })
}

export async function POST(req: NextRequest) {
  const { businessId, workflows } = await req.json()
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })

  await storeWorkflows(businessId, workflows)
  return NextResponse.json({ success: true })
}
