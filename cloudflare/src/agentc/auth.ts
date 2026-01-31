/**
 * Agent C authentication: email magic code flow.
 *
 * 1. User requests a code → stored in D1
 * 2. User submits code → verified, user upserted, session JWT issued
 */

import { AGENTC_SESSION_DURATION_S, AGENTC_CODE_EXPIRY_MIN } from '../config';
import { createSessionToken } from './jwt';
import { sendLoginCode } from './email';
import {
  storeAuthCode,
  verifyAuthCode,
  upsertUser,
  getUserByEmail,
  createSession,
} from '../storage/d1';

/**
 * Generate a 6-digit numeric code.
 */
function generateCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, '0');
}

/**
 * Step 1: Send a login code to the given email.
 */
export async function sendCode(
  db: D1Database,
  email: string,
  devMode: boolean
): Promise<{ code?: string }> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + AGENTC_CODE_EXPIRY_MIN * 60_000).toISOString();

  await storeAuthCode(db, email, code, expiresAt);
  await sendLoginCode(email, code, devMode);

  // In dev mode, return code directly for ease of testing
  return devMode ? { code } : {};
}

/**
 * Step 2: Verify a code, upsert the user, create a session, return JWT.
 */
export async function verifyCode(
  db: D1Database,
  jwtSecret: string,
  email: string,
  code: string
): Promise<{ token: string; user: { id: string; email: string; displayName: string | null; tier: string } }> {
  const valid = await verifyAuthCode(db, email, code);
  if (!valid) {
    throw new Error('Invalid or expired code');
  }

  // Upsert user
  const userId = crypto.randomUUID();
  const deviceId = `agentc-${userId}`;
  let existing = await getUserByEmail(db, email);
  if (!existing) {
    existing = await upsertUser(db, { id: userId, email, deviceId });
  } else {
    // Touch last_seen
    await upsertUser(db, { id: existing.id, email, deviceId: existing.device_id });
  }

  const user = existing;

  // Create session
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + AGENTC_SESSION_DURATION_S * 1000).toISOString();
  await createSession(db, { id: sessionId, userId: user.id, expiresAt });

  // Issue JWT
  const token = await createSessionToken(
    { jti: sessionId, sub: user.id, email: user.email },
    jwtSecret,
    AGENTC_SESSION_DURATION_S
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      tier: user.tier,
    },
  };
}
