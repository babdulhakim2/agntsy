import { BusinessInfo, BusinessAnalysis, Workflow, PainPoint, EvalMetric } from './types';
import { mockAnalysis } from './mockData-discover';

function generateWorkflowId(): string {
  return 'wf_' + Math.random().toString(36).substring(2, 12);
}

const ANALYSIS_PROMPT = `You are an expert business analyst specializing in AI automation and workflow design.

Analyze the following business data (including customer reviews) and produce a comprehensive analysis.

## Business Data
{BUSINESS_DATA}

## Your Task

1. **Identify the business type** (e.g., coffee_shop, restaurant, salon, gym, etc.)

2. **Extract pain points** from the reviews:
   - Each pain point should have: issue name, frequency (how many reviews mention it), severity (low/medium/high/critical), example quotes, and category (operations/product/service/technology/hygiene/pricing)
   - Be thorough — look for both explicit complaints and subtle hints of dissatisfaction

3. **Identify strengths** the business should maintain

4. **List unanswered questions** customers commonly have (things they wish they knew)

5. **Design 4 AI-powered workflows** that would address the pain points. Each workflow must specify:
   - Unique ID, name, description
   - Trigger (cron schedule or event-based)
   - Tools used (choose from: browser, tts, voice, llm, image_model, camera, sms, email, calendar)
   - Whether it's user-facing (customers interact with it) or internal (staff only)
   - Specific actions the workflow performs (step-by-step)
   - Eval metrics with name, description, target value, and measurement method

   Make workflows SMART:
   - Use "browser" for web monitoring, review scraping, competitor tracking
   - Use "tts" + "voice" for phone systems, customer calls, voice alerts
   - Use "image_model" for visual inspection, menu scanning, quality checks
   - Use "camera" for real-time monitoring, queue estimation, security
   - Mix tools creatively for powerful automation

## Output Format (JSON)
{
  "business_type": "string",
  "pain_points": [
    {
      "issue": "string",
      "frequency": number,
      "severity": "low|medium|high|critical",
      "example_quotes": ["string"],
      "category": "string"
    }
  ],
  "strengths": ["string"],
  "unanswered_questions": ["string"],
  "suggested_workflows": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "trigger": "string",
      "tools_used": ["string"],
      "user_facing": boolean,
      "actions": ["string"],
      "eval_metrics": [
        {
          "name": "string",
          "description": "string",
          "target": "string",
          "measurement": "string"
        }
      ]
    }
  ]
}

Return ONLY valid JSON, no markdown fences or extra text.`;

/**
 * Analyze business using Claude API
 */
async function analyzeBusinessReal(business: BusinessInfo): Promise<BusinessAnalysis> {
  // @ts-ignore
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = ANALYSIS_PROMPT.replace('{BUSINESS_DATA}', JSON.stringify(business, null, 2));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = JSON.parse(text);

  const now = new Date().toISOString();

  const workflows: Workflow[] = (parsed.suggested_workflows || []).map((w: any) => ({
    ...w,
    id: w.id || generateWorkflowId(),
    business_id: business.id,
    status: 'suggested' as const,
    feedback: { thumbs_up: 0, thumbs_down: 0, edits: [] },
    created_at: now,
    updated_at: now,
    eval_metrics: (w.eval_metrics || []).map((m: any) => ({
      name: m.name,
      description: m.description,
      target: m.target || undefined,
      measurement: m.measurement,
    })),
  }));

  return {
    business_id: business.id,
    business_type: parsed.business_type,
    pain_points: parsed.pain_points || [],
    strengths: parsed.strengths || [],
    unanswered_questions: parsed.unanswered_questions || [],
    suggested_workflows: workflows,
    analyzed_at: now,
  };
}

/**
 * Mock analysis — returns realistic fake data
 */
async function analyzeBusinessMock(business: BusinessInfo): Promise<BusinessAnalysis> {
  await new Promise((r) => setTimeout(r, 300));
  return {
    ...mockAnalysis,
    business_id: business.id,
    analyzed_at: new Date().toISOString(),
    suggested_workflows: mockAnalysis.suggested_workflows.map((w) => ({
      ...w,
      business_id: business.id,
    })),
  };
}

/**
 * Analyze a business — uses Claude if API key available, otherwise mock
 */
export async function analyzeBusiness(business: BusinessInfo): Promise<BusinessAnalysis> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await analyzeBusinessReal(business);
    } catch (error) {
      console.error('Claude analysis failed, falling back to mock:', error);
      return analyzeBusinessMock(business);
    }
  }
  return analyzeBusinessMock(business);
}
