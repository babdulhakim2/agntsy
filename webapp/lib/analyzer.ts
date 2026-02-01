import OpenAI from 'openai'
import type { BusinessInfo, BusinessAnalysis, PainPoint, Strength, Workflow, ToolType, EvalMetric } from './discover-types'
import { initWeave, getTracedOpenAI, traceOp } from './weave-client'

// Will be replaced with traced client on first call
let openai: any = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const ANALYSIS_PROMPT = `You are a business operations analyst who designs AI agent workflows with RUNNABLE evaluation harnesses.

You have access to these AI skills/tools to build workflows:
- **voice** (Vapi/ElevenLabs): Build phone answering agents, outbound calls, voice bots
- **tts** (ElevenLabs): Text-to-speech for voice responses, IVR menus
- **browser** (Browserbase/Stagehand): Automated web browsing — scrape sites, fill forms, monitor pages
- **llm** (GPT-4o/Claude): Text analysis, generation, classification, summarization
- **sms** (Twilio): Send/receive text messages, alerts, confirmations
- **email** (SendGrid): Automated email responses, campaigns, notifications
- **calendar** (Google Calendar): Schedule appointments, check availability, send reminders
- **image_model** (GPT-4V): Analyze images — read menus, check photos, verify visual content
- **camera**: Capture/monitor physical spaces
- **video**: Video processing and analysis

Given a business's Google Maps reviews, return a structured JSON with:

1. **pain_points**: Recurring issues from reviews. Each has:
   - issue: snake_case identifier
   - label: human-readable label
   - frequency: how many reviews mention this (integer)
   - severity: "low" | "medium" | "high" | "critical"
   - example_quotes: 2-3 direct quotes from reviews

2. **strengths**: What the business does well. Each: { label, mentions }

3. **unanswered_questions**: Customer questions that aren't answered. Array of strings.

4. **suggested_workflows**: 4-6 AI workflows that solve the pain points. Each workflow is a REAL agent that would be deployed using the tools above. Each has:
   - id: unique id (e.g. "wf-phone-receptionist")
   - name: catchy workflow name
   - description: 1-2 sentence explanation of what this agent does
   - trigger: when it activates (e.g. "Inbound phone call", "New Google review detected", "Daily 9AM")
   - tools_used: array of tools from the list above that this agent needs
   - user_facing: boolean — does the end customer interact with this agent?
   - actions: array of 3-5 concrete steps the agent takes
   - eval_harness: array of RUNNABLE test cases that measure whether this agent works. Each eval is a specific test scenario:
     - name: test case identifier (e.g. "hours_inquiry_test")
     - scenario: A concrete test scenario description (e.g. "Caller asks 'What time do you close on Saturday?' — agent should respond with correct Saturday hours from Google listing")
     - input: The test input (e.g. the question asked, the review submitted, the email received)
     - expected_behavior: What the agent SHOULD do (specific, measurable)
     - scoring: How to score pass/fail — "exact_match", "contains_keyword", "sentiment_positive", "response_under_seconds", "llm_judge"
     - target: Pass threshold (e.g. 0.8 for 80% accuracy, or true for boolean pass)
   - pain_point_id: which pain_point this addresses
   - confidence: 0-1

CRITICAL RULES FOR EVAL HARNESSES:
- Each workflow MUST have 2-4 eval test cases
- Evals must be RUNNABLE — imagine you will actually execute them against the deployed agent
- Use real data from the reviews as test inputs (e.g., actual customer complaints become test scenarios)
- For voice agents: test with specific questions callers would ask
- For browser agents: test with specific URLs and expected data to find
- For review responders: test with actual negative reviews and check response quality
- Scoring should use: "llm_judge" (LLM grades the output), "contains_keyword" (output must contain specific info), "response_under_seconds" (latency check), "exact_match", or "sentiment_positive"

Return ONLY valid JSON. No markdown, no explanation.`

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

  const VALID_SCORING = ['exact_match', 'contains_keyword', 'sentiment_positive', 'response_under_seconds', 'llm_judge']

  const suggested_workflows: Workflow[] = (raw.suggested_workflows || []).map((w: any, i: number) => ({
    id: w.id || `wf-${i}`,
    name: w.name || 'Unnamed Workflow',
    description: w.description || '',
    trigger: w.trigger || 'Manual',
    tools_used: Array.isArray(w.tools_used) ? w.tools_used.filter((t: string) => VALID_TOOLS.includes(t as ToolType)) : ['llm'],
    user_facing: Boolean(w.user_facing),
    actions: Array.isArray(w.actions) ? w.actions : [],
    // Legacy eval_metrics (keep for backwards compat)
    eval_metrics: Array.isArray(w.eval_metrics) ? w.eval_metrics.map((m: any) => ({
      name: m.name || 'metric',
      description: m.description || '',
      type: (['boolean', 'number', 'percentage'].includes(m.type) ? m.type : 'boolean') as EvalMetric['type'],
      target: m.target,
    })) : [],
    // New: runnable eval test cases
    eval_harness: Array.isArray(w.eval_harness) ? w.eval_harness.map((e: any) => ({
      name: e.name || 'test',
      scenario: e.scenario || '',
      input: e.input || '',
      expected_behavior: e.expected_behavior || '',
      scoring: VALID_SCORING.includes(e.scoring) ? e.scoring : 'llm_judge',
      target: e.target ?? true,
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
