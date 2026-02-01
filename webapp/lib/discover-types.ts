// ─── Discovery Pipeline Types ───

export interface BusinessInfo {
  id: string
  name: string
  type: string
  rating: number
  reviewCount: number
  address: string
  phone?: string
  website?: string
  hours?: string
  priceLevel?: string
  mapsUrl: string
  scrapedAt: string
}

export interface Review {
  author: string
  rating: number
  text: string
  date: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export interface PainPoint {
  issue: string
  label: string
  frequency: number
  severity: 'low' | 'medium' | 'high'
  exampleQuotes: string[]
}

export interface Strength {
  label: string
  mentions: number
}

export type ToolType = 'browser' | 'voice' | 'tts' | 'image_model' | 'video' | 'sms' | 'email' | 'calendar'

export interface Workflow {
  id: string
  name: string
  description: string
  trigger: string
  toolsUsed: ToolType[]
  userFacing: boolean
  actions: string[]
  evalMetrics: EvalMetric[]
  painPointId: string
  status: 'suggested' | 'active' | 'dismissed'
  feedback?: 'good' | 'bad' | null
  confidence: number
}

export interface EvalMetric {
  name: string
  description: string
  type: 'boolean' | 'number' | 'percentage'
  target?: number
}

export interface BusinessAnalysis {
  businessId: string
  businessType: string
  painPoints: PainPoint[]
  strengths: Strength[]
  unansweredQuestions: string[]
  workflows: Workflow[]
  analyzedAt: string
}

export interface DiscoveryState {
  step: 'idle' | 'opening' | 'scraping_info' | 'scraping_reviews' | 'scraping_website' | 'analyzing' | 'generating' | 'done' | 'error'
  progress: number
  message: string
  business?: BusinessInfo
  reviews?: Review[]
  analysis?: BusinessAnalysis
  error?: string
}

export const TOOL_META: Record<ToolType, { icon: string; label: string; color: string }> = {
  browser: { icon: '🌐', label: 'Browser', color: '#22D3EE' },
  voice: { icon: '📞', label: 'Voice AI', color: '#60A5FA' },
  tts: { icon: '🔊', label: 'Text-to-Speech', color: '#A78BFA' },
  image_model: { icon: '📸', label: 'Vision AI', color: '#F472B6' },
  video: { icon: '🎥', label: 'Video AI', color: '#FB923C' },
  sms: { icon: '💬', label: 'SMS', color: '#34D399' },
  email: { icon: '📧', label: 'Email', color: '#FBBF24' },
  calendar: { icon: '📅', label: 'Calendar', color: '#6EE7B7' },
}
