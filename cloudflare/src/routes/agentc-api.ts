/**
 * /api/v1/* route handlers for Agent C multi-user backend.
 */

import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { requireAgentCSession } from '../agentc/middleware';
import { sendCode, verifyCode } from '../agentc/auth';
import { migrateSchema } from '../storage/d1';
import {
  updateUserDisplayName,
  getUserById,
  listConversations,
  createConversation,
  getConversation,
  deleteConversation,
  getUsageToday,
  revokeSession,
} from '../storage/d1';
import { readMessages, deleteConversationMessages } from '../storage/r2-user';
import { AGENTC_DAILY_MESSAGE_LIMIT } from '../config';

const agentcApi = new Hono<AppEnv>();

// ─── Schema migration (auto-run on first request) ───────────────────────────

let migrated = false;

agentcApi.use('*', async (c, next) => {
  if (!c.env.AGENTC_JWT_SECRET) {
    return c.json({ error: 'Agent C not configured (missing AGENTC_JWT_SECRET)' }, 503);
  }
  if (!migrated) {
    await migrateSchema(c.env.AGENTC_DB);
    migrated = true;
  }
  return next();
});

// ─── Auth (public, no session required) ──────────────────────────────────────

agentcApi.post('/auth/send-code', async (c) => {
  const body = await c.req.json<{ email?: string }>();
  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return c.json({ error: 'email is required' }, 400);
  }

  const devMode = c.env.DEV_MODE === 'true';
  const result = await sendCode(c.env.AGENTC_DB, email, devMode);

  return c.json({ success: true, ...(result.code ? { _dev_code: result.code } : {}) });
});

agentcApi.post('/auth/verify', async (c) => {
  const body = await c.req.json<{ email?: string; code?: string }>();
  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();
  if (!email || !code) {
    return c.json({ error: 'email and code are required' }, 400);
  }

  try {
    const result = await verifyCode(c.env.AGENTC_DB, c.env.AGENTC_JWT_SECRET!, email, code);
    return c.json({ sessionToken: result.token, user: result.user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return c.json({ error: message }, 401);
  }
});

agentcApi.post('/auth/logout', requireAgentCSession, async (c) => {
  const user = c.get('agentcUser')!;
  // We need the session ID — re-extract from token
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    const { verifySessionToken } = await import('../agentc/jwt');
    try {
      const claims = await verifySessionToken(token, c.env.AGENTC_JWT_SECRET!);
      await revokeSession(c.env.AGENTC_DB, claims.jti);
    } catch {
      // Token already invalid, that's fine
    }
  }
  return c.json({ success: true });
});

// ─── User (session required) ─────────────────────────────────────────────────

agentcApi.get('/user', requireAgentCSession, async (c) => {
  const user = c.get('agentcUser')!;
  return c.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    tier: user.tier,
  });
});

agentcApi.patch('/user', requireAgentCSession, async (c) => {
  const user = c.get('agentcUser')!;
  const body = await c.req.json<{ displayName?: string }>();

  if (body.displayName !== undefined) {
    await updateUserDisplayName(c.env.AGENTC_DB, user.id, body.displayName);
  }

  const updated = await getUserById(c.env.AGENTC_DB, user.id);
  return c.json({
    id: updated!.id,
    email: updated!.email,
    displayName: updated!.display_name,
    tier: updated!.tier,
  });
});

// ─── Conversations (session required) ────────────────────────────────────────

agentcApi.get('/conversations', requireAgentCSession, async (c) => {
  const user = c.get('agentcUser')!;
  const convs = await listConversations(c.env.AGENTC_DB, user.id);
  return c.json({
    conversations: convs.map(cv => ({
      id: cv.id,
      title: cv.title,
      messageCount: cv.message_count,
      createdAt: cv.created_at,
      updatedAt: cv.updated_at,
    })),
  });
});

agentcApi.post('/conversations', requireAgentCSession, async (c) => {
  const user = c.get('agentcUser')!;
  const body = await c.req.json<{ title?: string }>().catch(() => ({} as { title?: string }));
  const id = crypto.randomUUID();

  const conv = await createConversation(c.env.AGENTC_DB, {
    id,
    userId: user.id,
    title: body.title,
  });

  return c.json(
    { id: conv.id, title: conv.title, createdAt: conv.created_at },
    201
  );
});

agentcApi.get('/conversations/:id/messages', requireAgentCSession, async (c) => {
  const user = c.get('agentcUser')!;
  const convId = c.req.param('id');

  // Verify ownership
  const conv = await getConversation(c.env.AGENTC_DB, convId, user.id);
  if (!conv) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  const limit = parseInt(new URL(c.req.url).searchParams.get('limit') || '50', 10);
  const before = new URL(c.req.url).searchParams.get('before') ?? undefined;

  const result = await readMessages(c.env.MOLTBOT_BUCKET, user.id, convId, { limit, before });
  return c.json(result);
});

agentcApi.delete('/conversations/:id', requireAgentCSession, async (c) => {
  const user = c.get('agentcUser')!;
  const convId = c.req.param('id');

  const deleted = await deleteConversation(c.env.AGENTC_DB, convId, user.id);
  if (!deleted) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  // Clean up R2 messages in background
  c.executionCtx.waitUntil(
    deleteConversationMessages(c.env.MOLTBOT_BUCKET, user.id, convId)
  );

  return c.json({ success: true });
});

// ─── Usage (session required) ────────────────────────────────────────────────

agentcApi.get('/usage', requireAgentCSession, async (c) => {
  const user = c.get('agentcUser')!;
  const messagesSent = await getUsageToday(c.env.AGENTC_DB, user.id);

  return c.json({
    today: { messages: messagesSent },
    limit: { daily: AGENTC_DAILY_MESSAGE_LIMIT },
  });
});

export { agentcApi };
