import * as weave from 'weave'

let initialized = false
let wrappedOpenAI: any = null

export async function initWeave() {
  if (initialized) return
  try {
    await weave.init('agentsy-business-agent')
    initialized = true
    console.log('[Weave] Initialized — project: agentsy-business-agent')
  } catch (err) {
    console.error('[Weave] Init failed:', err)
  }
}

/**
 * Get a Weave-wrapped OpenAI client that auto-traces all calls
 */
export function getTracedOpenAI() {
  if (!wrappedOpenAI) {
    const OpenAI = require('openai').default
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    wrappedOpenAI = weave.wrapOpenAI(client)
    console.log('[Weave] Wrapped OpenAI client for tracing')
  }
  return wrappedOpenAI
}

/**
 * Wrap a function as a Weave op for tracing
 */
export function traceOp<T extends (...args: any[]) => any>(fn: T, name?: string): T {
  try {
    return weave.op(fn, { name }) as T
  } catch {
    return fn
  }
}

/**
 * Log workflow feedback as a Weave score
 */
export const logWorkflowFeedback = traceOp(
  async function logWorkflowFeedback(input: {
    businessId: string
    businessName: string
    workflowId: string
    workflowName: string
    action: 'thumbs_up' | 'thumbs_down'
  }) {
    return {
      businessId: input.businessId,
      workflowId: input.workflowId,
      workflowName: input.workflowName,
      feedback: input.action,
      score: input.action === 'thumbs_up' ? 1.0 : 0.0,
      timestamp: new Date().toISOString(),
    }
  },
  'logWorkflowFeedback'
)

export { weave }
