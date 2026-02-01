import OpenAI from 'openai'
import { initWeave, traceOp } from './weave-client'
import type { BusinessInfo } from './discover-types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface TaskEval {
  metric: string
  description: string
  type: 'boolean' | 'number' | 'percentage'
  target?: number
  current?: number
}

export interface BusinessTask {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: 'reviews' | 'operations' | 'marketing' | 'competitive' | 'customer_experience'
  reasoning: string
  evidence: string[]
  actions: string[]
  eval_harness: TaskEval[]
  estimated_impact: string
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
}

export interface BusinessProfile {
  business: BusinessInfo
  tasks: BusinessTask[]
  summary: string
  top_issue: string
  sentiment_score: number
  analyzed_at: string
  browserbaseSessionId?: string
  browserbaseSessionUrl?: string
}

const TASK_PROMPT = `You are a business improvement AI agent. You analyze real Google Maps reviews to identify specific, actionable tasks that will improve this business.

For each task you generate, you MUST include an evaluation harness — specific metrics that can be measured to determine if the task was successful. This is critical: every recommendation must be measurable.

Given the business info and reviews, generate 4-6 prioritized tasks.

Each task must have:
- id: unique short id (e.g., "task-review-response")
- title: clear action title (e.g., "Respond to 8 unanswered negative reviews")
- description: 2-3 sentences explaining what to do and why
- priority: "critical" | "high" | "medium" | "low"
- category: "reviews" | "operations" | "marketing" | "competitive" | "customer_experience"
- reasoning: why this matters, backed by data from reviews
- evidence: 2-4 direct quotes from reviews that support this task
- actions: 3-5 specific steps to complete this task
- eval_harness: array of measurable metrics, each with:
  - metric: short name (e.g., "response_rate")
  - description: what it measures
  - type: "boolean" | "number" | "percentage"
  - target: numeric target (e.g., 90 for 90%)
- estimated_impact: one sentence on expected outcome

Also provide:
- summary: 2-3 sentence overview of the business's current state
- top_issue: the single biggest issue (one sentence)
- sentiment_score: 0-100 overall sentiment from reviews

Be specific. Reference actual reviews. Don't be generic. Every task should be something the owner can act on TODAY.

Return ONLY valid JSON.`

async function generateTasksRaw(business: BusinessInfo): Promise<any> {
  const reviewsText = business.reviews
    .map(r => `[${r.rating}★ ${r.author}, ${r.date}]: "${r.text}"`)
    .join('\n')

  const negativeCount = business.reviews.filter(r => r.rating <= 2).length
  const positiveCount = business.reviews.filter(r => r.rating >= 4).length

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: TASK_PROMPT },
      {
        role: 'user', content: `Business: ${business.name}
Type: ${business.type}
Rating: ${business.rating}/5 (${business.review_count} total reviews)
Address: ${business.address}
${business.phone ? `Phone: ${business.phone}` : ''}
${business.website ? `Website: ${business.website}` : ''}
${business.price_level ? `Price: ${business.price_level}` : ''}

Reviews scraped: ${business.reviews.length} (${positiveCount} positive, ${negativeCount} negative)

${reviewsText}

Generate prioritized improvement tasks with evaluation harnesses.`
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content || '{}')
}

// Wrap with Weave tracing
const generateTasksTraced = traceOp(generateTasksRaw, 'generateBusinessTasks')

export async function generateBusinessProfile(
  business: BusinessInfo,
  sessionId?: string,
  sessionUrl?: string
): Promise<BusinessProfile> {
  await initWeave()

  const raw = await generateTasksTraced(business)

  const tasks: BusinessTask[] = (raw.tasks || []).map((t: any) => ({
    id: t.id || `task-${Math.random().toString(36).slice(2, 8)}`,
    title: t.title || 'Untitled Task',
    description: t.description || '',
    priority: ['critical', 'high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
    category: ['reviews', 'operations', 'marketing', 'competitive', 'customer_experience'].includes(t.category)
      ? t.category : 'operations',
    reasoning: t.reasoning || '',
    evidence: Array.isArray(t.evidence) ? t.evidence : [],
    actions: Array.isArray(t.actions) ? t.actions : [],
    eval_harness: Array.isArray(t.eval_harness) ? t.eval_harness.map((e: any) => ({
      metric: e.metric || 'metric',
      description: e.description || '',
      type: ['boolean', 'number', 'percentage'].includes(e.type) ? e.type : 'boolean',
      target: e.target,
      current: e.current,
    })) : [],
    estimated_impact: t.estimated_impact || '',
    status: 'pending' as const,
  }))

  return {
    business,
    tasks,
    summary: raw.summary || '',
    top_issue: raw.top_issue || '',
    sentiment_score: typeof raw.sentiment_score === 'number' ? raw.sentiment_score : 50,
    analyzed_at: new Date().toISOString(),
    browserbaseSessionId: sessionId,
    browserbaseSessionUrl: sessionUrl,
  }
}
