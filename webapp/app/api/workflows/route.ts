import { NextRequest, NextResponse } from 'next/server'
import { getWorkflows, storeWorkflows } from '@/lib/redis-client'
import { initWeave, logWorkflowFeedback } from '@/lib/weave-client'

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

// PATCH: Handle workflow feedback (thumbs up/down) — traced in Weave
export async function PATCH(req: NextRequest) {
  try {
    await initWeave()
    const body = await req.json()
    const { business_id, workflow_id, workflow_name, business_name, action } = body

    console.log(`[Workflows] Feedback: ${action} on ${workflow_id} for ${business_id}`)

    // Log to Weave
    const result = await logWorkflowFeedback({
      businessId: business_id || 'unknown',
      businessName: business_name || 'unknown',
      workflowId: workflow_id,
      workflowName: workflow_name || workflow_id,
      action,
    })

    return NextResponse.json({ success: true, feedback: result })
  } catch (error) {
    console.error('[Workflows] Feedback error:', error)
    return NextResponse.json({ success: true }) // Non-critical, don't fail
  }
}
