import * as weave from 'weave'

let initialized = false

export async function initWeave() {
  if (initialized) return
  try {
    await weave.init('business-agent')
    initialized = true
    console.log('[Weave] Initialized')
  } catch (err) {
    console.error('[Weave] Init failed:', err)
  }
}

// Wrap a function as a Weave op for tracing
export function traceOp<T extends (...args: any[]) => any>(fn: T, name?: string): T {
  try {
    return weave.op(fn, { name }) as T
  } catch {
    return fn
  }
}

export { weave }
