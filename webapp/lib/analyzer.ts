import OpenAI from 'openai'
import type { BusinessInfo, BusinessAnalysis, PainPoint, Strength, Workflow, ToolType, EvalMetric } from './discover-types'
import { initWeave, getTracedOpenAI, traceOp } from './weave-client'

// Will be replaced with traced client on first call
let openai: any = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const ANALYSIS_PROMPT = `You are a business operations analyst specializing in AI workflow automation for small/medium businesses.

Given a business's Google Maps reviews, analyze them and return a structured JSON response with:

1. **pain_points**: Recurring issues from negative/neutral reviews. Each has:
   - issue: short identifier (snake_case, e.g. "long_wait_times")
   - label: human-readable label (e.g. "Long Wait Times")
   - frequency: how many reviews mention this (integer)
   - severity: "low" | "medium" | "high" | "critical"
   - example_quotes: 2-3 direct quotes from reviews

2. **strengths**: What the business does well. Each has:
   - label: strength name (e.g. "Coffee Quality")
   - mentions: how many reviews mention this (integer)

3. **unanswered_questions**: Questions customers have that aren't answered (from reviews). Array of strings.

4. **suggested_workflows**: 4-6 AI-powered workflows that address the pain points. Each has:
   - id: unique id (e.g. "wf-review-responder")
   - name: catchy workflow name
   - description: 1-2 sentence explanation
   - trigger: when it runs (e.g. "Every 4 hours", "Inbound phone call", "Daily at 9AM")
   - tools_used: array from ["browser", "voice", "tts", "image_model", "video", "sms", "email", "calendar", "llm", "camera"]
   - user_facing: boolean (does the customer see this?)
   - actions: array of 3-5 step descriptions
   - eval_metrics: array of measurable outcomes, each with:
     - name: metric identifier
     - description: what it measures
     - type: "boolean" | "number" | "percentage"
     - target: optional numeric target
   - pain_point_id: which pain_point this addresses (the issue field)
   - confidence: 0-1 how confident this workflow would help

IMPORTANT: Make workflows creative, specific to the business type, and actionable. Use multiple tool types. Think about what an AI agent could actually automate.

Return ONLY valid JSON matching this schema. No markdown, no explanation.`

// Eagerly init Weave on module load
const _weaveReady = initWeave().catch(() => {})

async function _analyzeBusinessReviews(business: BusinessInfo): Promise<BusinessAnalysis> {
  // Ensure Weave is ready + use traced OpenAI client
  await _weaveReady
  try { openai = getTracedOpenAI() } catch {}

  const hasReviews = business.reviews && business.reviews.length > 0
  const reviewsText = hasReviews
    ? business.reviews.map(r => `[${r.rating}★ - ${r.author}, ${r.date}]: "${r.text}"`).join('\n')
    : '(No individual reviews scraped — analyze based on business type, rating, and common pain points for this industry)'

  const userPrompt = `Business: ${business.name}
Type: ${business.type}
Rating: ${business.rating}/5 (${business.review_count} reviews total on Google Maps)
Address: ${business.address}
${business.phone ? `Phone: ${business.phone}` : ''}
${business.website ? `Website: ${business.website}` : ''}
${business.price_level ? `Price Level: ${business.price_level}` : ''}
${business.hours ? `Hours: ${business.hours}` : ''}

${hasReviews ? `Reviews (${business.reviews.length} scraped):` : 'No individual reviews available. Based on the business type, rating, and industry standards, infer likely pain points and generate workflows.'}
${reviewsText}

Analyze this business and generate AI workflow recommendations that would help them improve operations and customer experience.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: ANALYSIS_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })

  const raw = JSON.parse(response.choices[0].message.content || '{}')

  // Validate and type the response
  const pain_points: PainPoint[] = (raw.pain_points || []).map((p: any) => ({
    issue: p.issue || 'unknown',
    label: p.label || p.issue || 'Unknown Issue',
    frequency: p.frequency || 1,
    severity: (['low', 'medium', 'high', 'critical'].includes(p.severity) ? p.severity : 'medium') as PainPoint['severity'],
    example_quotes: Array.isArray(p.example_quotes) ? p.example_quotes.slice(0, 3) : [],
  }))

  const strengths: Strength[] = (raw.strengths || []).map((s: any) => ({
    label: s.label || 'Unknown',
    mentions: s.mentions || 1,
  }))

  const unanswered_questions: string[] = Array.isArray(raw.unanswered_questions) ? raw.unanswered_questions : []

  const VALID_TOOLS: ToolType[] = ['browser', 'voice', 'tts', 'image_model', 'video', 'sms', 'email', 'calendar', 'llm', 'camera']

  const suggested_workflows: Workflow[] = (raw.suggested_workflows || []).map((w: any, i: number) => ({
    id: w.id || `wf-${i}`,
    name: w.name || 'Unnamed Workflow',
    description: w.description || '',
    trigger: w.trigger || 'Manual',
    tools_used: Array.isArray(w.tools_used) ? w.tools_used.filter((t: string) => VALID_TOOLS.includes(t as ToolType)) : ['llm'],
    user_facing: Boolean(w.user_facing),
    actions: Array.isArray(w.actions) ? w.actions : [],
    eval_metrics: Array.isArray(w.eval_metrics) ? w.eval_metrics.map((m: any) => ({
      name: m.name || 'metric',
      description: m.description || '',
      type: (['boolean', 'number', 'percentage'].includes(m.type) ? m.type : 'boolean') as EvalMetric['type'],
      target: m.target,
    })) : [],
    pain_point_id: w.pain_point_id || '',
    status: 'suggested' as const,
    confidence: typeof w.confidence === 'number' ? Math.min(1, Math.max(0, w.confidence)) : 0.8,
  }))

  return {
    business_id: business.id,
    business_type: business.type,
    pain_points,
    strengths,
    unanswered_questions,
    suggested_workflows,
    analyzed_at: new Date().toISOString(),
  }
}

// Export as Weave-traced op
export const analyzeBusinessReviews = traceOp(_analyzeBusinessReviews, 'analyzeBusinessReviews')
