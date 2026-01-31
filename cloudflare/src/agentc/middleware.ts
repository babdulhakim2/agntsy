/**
 * Hono middleware for Agent C session authentication.
 *
 * Extracts session JWT from:
 *   - Authorization: Bearer <token>
 *   - Query parameter: ?session=<token>
 *
 * On success, sets `agentcUser` on the Hono context.
 */

import type { Context, Next } from 'hono';
import type { AppEnv } from '../types';
import { verifySessionToken } from './jwt';
import { getActiveSession, getUserById, touchUserLastSeen } from '../storage/d1';

/**
 * Extract a session token from the request.
 */
function extractToken(c: Context<AppEnv>): string | null {
  // Bearer header
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Query param (used for WebSocket connections)
  const sessionParam = new URL(c.req.url).searchParams.get('session');
  if (sessionParam) {
    return sessionParam;
  }

  return null;
}

/**
 * Middleware that requires a valid Agent C session.
 * Sets c.var.agentcUser on success.
 */
export async function requireAgentCSession(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  const jwtSecret = c.env.AGENTC_JWT_SECRET;
  if (!jwtSecret) {
    return c.json({ error: 'Agent C not configured' }, 503);
  }

  const token = extractToken(c);
  if (!token) {
    return c.json({ error: 'Unauthorized', hint: 'Provide Authorization: Bearer <token>' }, 401);
  }

  let claims;
  try {
    claims = await verifySessionToken(token, jwtSecret);
  } catch {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  // Check session is still active in D1
  const db = c.env.AGENTC_DB;
  const session = await getActiveSession(db, claims.jti);
  if (!session) {
    return c.json({ error: 'Session revoked or expired' }, 401);
  }

  // Load user
  const user = await getUserById(db, claims.sub);
  if (!user || user.status !== 'active') {
    return c.json({ error: 'User not found or inactive' }, 403);
  }

  // Set context variable
  c.set('agentcUser', {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    deviceId: user.device_id,
    status: user.status,
    tier: user.tier,
    createdAt: user.created_at,
    lastSeenAt: user.last_seen_at,
  });

  // Touch last seen in the background
  c.executionCtx.waitUntil(touchUserLastSeen(db, user.id));

  return next();
}

/**
 * Extract and validate an Agent C session token.
 * Returns user info or null (does not send a response).
 * Useful for the WebSocket path where we need the user but handle errors differently.
 */
export async function resolveAgentCSession(
  token: string,
  jwtSecret: string,
  db: D1Database
): Promise<{
  id: string;
  email: string;
  displayName: string | null;
  deviceId: string;
  tier: string;
  sessionId: string;
} | null> {
  let claims;
  try {
    claims = await verifySessionToken(token, jwtSecret);
  } catch {
    return null;
  }

  const session = await getActiveSession(db, claims.jti);
  if (!session) return null;

  const user = await getUserById(db, claims.sub);
  if (!user || user.status !== 'active') return null;

  // Touch last seen
  touchUserLastSeen(db, user.id).catch(() => {});

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    deviceId: user.device_id,
    tier: user.tier,
    sessionId: claims.jti,
  };
}
