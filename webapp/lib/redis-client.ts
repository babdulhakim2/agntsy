import { BusinessInfo, BusinessAnalysis, Workflow } from './types';

// In-memory fallback store (used when Redis is unavailable)
const memoryStore = new Map<string, string>();

// Try to use Redis if available, otherwise fall back to in-memory
let redisClient: any = null;

async function getRedis() {
  if (redisClient) return redisClient;

  try {
    // @ts-ignore - redis may not be installed
    const { createClient } = await import('redis');
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    client.on('error', () => {
      redisClient = null;
    });
    await client.connect();
    redisClient = client;
    return client;
  } catch {
    return null;
  }
}

async function setKey(key: string, value: string, ttl?: number): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    if (ttl) {
      await redis.set(key, value, { EX: ttl });
    } else {
      await redis.set(key, value);
    }
  } else {
    memoryStore.set(key, value);
  }
}

async function getKey(key: string): Promise<string | null> {
  const redis = await getRedis();
  if (redis) {
    return await redis.get(key);
  }
  return memoryStore.get(key) || null;
}

// Business operations
export async function storeBusiness(business: BusinessInfo): Promise<void> {
  await setKey(`business:${business.id}`, JSON.stringify(business), 86400); // 24h TTL
}

export async function getBusiness(businessId: string): Promise<BusinessInfo | null> {
  const data = await getKey(`business:${businessId}`);
  return data ? JSON.parse(data) : null;
}

// Analysis operations
export async function storeAnalysis(analysis: BusinessAnalysis): Promise<void> {
  await setKey(`analysis:${analysis.business_id}`, JSON.stringify(analysis), 86400);
}

export async function getAnalysis(businessId: string): Promise<BusinessAnalysis | null> {
  const data = await getKey(`analysis:${businessId}`);
  return data ? JSON.parse(data) : null;
}

// Workflow operations
export async function storeWorkflows(businessId: string, workflows: Workflow[]): Promise<void> {
  await setKey(`workflows:${businessId}`, JSON.stringify(workflows), 86400);
}

export async function getWorkflows(businessId: string): Promise<Workflow[]> {
  const data = await getKey(`workflows:${businessId}`);
  return data ? JSON.parse(data) : [];
}

export async function updateWorkflowFeedback(
  businessId: string,
  workflowId: string,
  action: 'thumbs_up' | 'thumbs_down' | 'edit',
  editText?: string
): Promise<Workflow | null> {
  const workflows = await getWorkflows(businessId);
  const idx = workflows.findIndex((w) => w.id === workflowId);
  if (idx === -1) return null;

  const workflow = workflows[idx];
  if (!workflow.feedback) {
    workflow.feedback = { thumbs_up: 0, thumbs_down: 0, edits: [] };
  }

  if (action === 'thumbs_up') workflow.feedback.thumbs_up++;
  else if (action === 'thumbs_down') workflow.feedback.thumbs_down++;
  else if (action === 'edit' && editText) workflow.feedback.edits.push(editText);

  workflow.updated_at = new Date().toISOString();
  workflows[idx] = workflow;
  await storeWorkflows(businessId, workflows);
  return workflow;
}
