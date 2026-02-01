export interface Preset {
  icon: string;
  title: string;
  desc: string;
  prompt: string;
}

export interface AttachmentPreview {
  title: string;
  content: string;
}

export interface MessageAttachment {
  type: 'pdf' | 'doc' | 'sheet' | 'link';
  icon: string;
  name: string;
  meta: string;
  preview?: AttachmentPreview;
  linkPreview?: {
    img: string;
    domain: string;
    title: string;
    desc: string;
  };
}

export interface MessageTable {
  headers: string[];
  rows: string[][];
}

export interface Message {
  role: 'user' | 'agent';
  text: string;
  time: string;
  attachments?: MessageAttachment[];
  table?: MessageTable;
}

export interface Thread {
  id: number;
  title: string;
  avatarColor: string;
  avatarLetter: string;
  time: string;
  unread: boolean;
  messages: Message[];
}

export type TopicType = 'strategy' | 'research' | 'project' | 'personal';

export interface Memory {
  id: number;
  topic: TopicType;
  topicLabel: string;
  title: string;
  body: string;
  date: string;
  source: string;
  sourceCount: number;
}

// ============================================================
// Business Discovery + Workflow Generation Types
// ============================================================

export interface Review {
  author: string;
  rating: number;
  date: string;
  text: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  helpful_count?: number;
}

export interface BusinessInfo {
  id: string;
  name: string;
  type: string;
  rating: number;
  review_count: number;
  address: string;
  phone?: string;
  website?: string;
  hours?: string[];
  price_level?: string;
  photos?: string[];
  reviews: Review[];
  scraped_services?: string[];
  scraped_menu?: string[];
  scraped_pricing?: { item: string; price: string }[];
  screenshots?: string[];
  discovered_at: string;
  maps_url: string;
}

export interface PainPoint {
  issue: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  example_quotes: string[];
  category?: string;
}

export interface EvalMetric {
  name: string;
  description: string;
  target?: string;
  measurement: string;
}

export interface EvalTestCase {
  name: string;
  scenario: string;
  input: string;
  expected_behavior: string;
  scoring: 'exact_match' | 'contains_keyword' | 'sentiment_positive' | 'response_under_seconds' | 'llm_judge';
  target: number | boolean;
}

export interface Workflow {
  id: string;
  business_id: string;
  name: string;
  description: string;
  trigger: string;
  tools_used: string[];
  user_facing: boolean;
  actions: string[];
  eval_metrics: EvalMetric[];
  eval_harness: EvalTestCase[];
  status: 'suggested' | 'active' | 'paused' | 'archived';
  feedback?: {
    thumbs_up: number;
    thumbs_down: number;
    edits: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface BusinessAnalysis {
  business_id: string;
  business_type: string;
  pain_points: PainPoint[];
  strengths: string[];
  unanswered_questions: string[];
  suggested_workflows: Workflow[];
  analyzed_at: string;
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
  | 'error';

export interface DiscoveryProgress {
  step: DiscoveryStep;
  message: string;
  percent: number;
}
