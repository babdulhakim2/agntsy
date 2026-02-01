// ─── Discovery Pipeline Types ───

export interface Review {
  author: string
  rating: number
  text: string
  date: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export interface BusinessInfo {
  id: string
  name: string
  type: string
  rating: number
  review_count: number
  address: string
  phone?: string
  website?: string
  hours?: string
  price_level?: string
  maps_url: string
  scraped_at: string
  reviews: Review[]
}

export interface PainPoint {
  issue: string
  label: string
  frequency: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  example_quotes: string[]
}

export interface Strength {
  label: string
  mentions: number
}

export type ToolType = 'browser' | 'voice' | 'tts' | 'image_model' | 'video' | 'sms' | 'email' | 'calendar' | 'llm' | 'camera'

export interface EvalMetric {
  name: string
  description: string
  type: 'boolean' | 'number' | 'percentage'
  target?: number
}

export interface Workflow {
  id: string
  name: string
  description: string
  trigger: string
  tools_used: ToolType[]
  user_facing: boolean
  actions: string[]
  eval_metrics: EvalMetric[]
  pain_point_id: string
  status: 'suggested' | 'active' | 'dismissed'
  confidence: number
}

export interface BusinessAnalysis {
  business_id: string
  business_type: string
  pain_points: PainPoint[]
  strengths: Strength[]
  unanswered_questions: string[]
  suggested_workflows: Workflow[]
  analyzed_at: string
}

export type DiscoveryStep =
  | 'idle'
  | 'connecting'
  | 'loading_maps'
  | 'extracting_info'
  | 'scraping_reviews'
  | 'sorting_reviews'
  | 'scraping_website'
  | 'analyzing'
  | 'generating_workflows'
  | 'complete'
  | 'error'

export const TOOL_META: Record<string, { icon: string; label: string; color: string }> = {
  browser: { icon: '🌐', label: 'Browser', color: '#22D3EE' },
  voice: { icon: '🎙️', label: 'Voice AI', color: '#60A5FA' },
  tts: { icon: '🔊', label: 'Text-to-Speech', color: '#A78BFA' },
  image_model: { icon: '👁️', label: 'Vision AI', color: '#F472B6' },
  video: { icon: '🎥', label: 'Video AI', color: '#FB923C' },
  sms: { icon: '📱', label: 'SMS', color: '#34D399' },
  email: { icon: '📧', label: 'Email', color: '#FBBF24' },
  calendar: { icon: '📅', label: 'Calendar', color: '#6EE7B7' },
  llm: { icon: '🧠', label: 'LLM', color: '#7C5CFC' },
  camera: { icon: '📷', label: 'Camera', color: '#F97316' },
}
