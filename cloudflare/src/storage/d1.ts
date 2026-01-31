/**
 * D1 query functions for Agent C multi-user data.
 */

// ─── Schema migration ────────────────────────────────────────────────────────

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    device_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    tier TEXT NOT NULL DEFAULT 'free',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen_at TEXT
);

CREATE TABLE IF NOT EXISTS auth_codes (
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (email, code)
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT,
    message_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_tracking (
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    messages_sent INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, date)
);
`;

/** Run schema migration (idempotent). */
export async function migrateSchema(db: D1Database): Promise<void> {
  const statements = SCHEMA_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  for (const sql of statements) {
    await db.prepare(sql).run();
  }
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  display_name: string | null;
  device_id: string;
  status: string;
  tier: string;
  created_at: string;
  last_seen_at: string | null;
}

export async function getUserByEmail(db: D1Database, email: string): Promise<DbUser | null> {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<DbUser>();
}

export async function getUserById(db: D1Database, id: string): Promise<DbUser | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<DbUser>();
}

export async function upsertUser(
  db: D1Database,
  user: { id: string; email: string; deviceId: string; displayName?: string }
): Promise<DbUser> {
  await db
    .prepare(
      `INSERT INTO users (id, email, device_id, display_name)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET last_seen_at = datetime('now')`
    )
    .bind(user.id, user.email, user.deviceId, user.displayName ?? null)
    .run();

  return (await getUserByEmail(db, user.email))!;
}

export async function updateUserDisplayName(
  db: D1Database,
  userId: string,
  displayName: string
): Promise<void> {
  await db
    .prepare('UPDATE users SET display_name = ? WHERE id = ?')
    .bind(displayName, userId)
    .run();
}

export async function touchUserLastSeen(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare("UPDATE users SET last_seen_at = datetime('now') WHERE id = ?")
    .bind(userId)
    .run();
}

// ─── Auth codes ──────────────────────────────────────────────────────────────

export async function storeAuthCode(
  db: D1Database,
  email: string,
  code: string,
  expiresAt: string
): Promise<void> {
  // Delete any existing unused codes for this email first
  await db
    .prepare('DELETE FROM auth_codes WHERE email = ? AND used = 0')
    .bind(email)
    .run();

  await db
    .prepare('INSERT INTO auth_codes (email, code, expires_at) VALUES (?, ?, ?)')
    .bind(email, code, expiresAt)
    .run();
}

export async function verifyAuthCode(
  db: D1Database,
  email: string,
  code: string
): Promise<boolean> {
  const row = await db
    .prepare(
      "SELECT * FROM auth_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')"
    )
    .bind(email, code)
    .first();

  if (!row) return false;

  // Mark as used
  await db
    .prepare('UPDATE auth_codes SET used = 1 WHERE email = ? AND code = ?')
    .bind(email, code)
    .run();

  return true;
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function createSession(
  db: D1Database,
  session: { id: string; userId: string; expiresAt: string }
): Promise<void> {
  await db
    .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(session.id, session.userId, session.expiresAt)
    .run();
}

export async function getActiveSession(
  db: D1Database,
  sessionId: string
): Promise<{ id: string; user_id: string; expires_at: string } | null> {
  return db
    .prepare(
      "SELECT id, user_id, expires_at FROM sessions WHERE id = ? AND revoked_at IS NULL AND expires_at > datetime('now')"
    )
    .bind(sessionId)
    .first();
}

export async function revokeSession(db: D1Database, sessionId: string): Promise<void> {
  await db
    .prepare("UPDATE sessions SET revoked_at = datetime('now') WHERE id = ?")
    .bind(sessionId)
    .run();
}

export async function revokeAllUserSessions(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare("UPDATE sessions SET revoked_at = datetime('now') WHERE user_id = ? AND revoked_at IS NULL")
    .bind(userId)
    .run();
}

// ─── Conversations ───────────────────────────────────────────────────────────

export interface DbConversation {
  id: string;
  user_id: string;
  title: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export async function listConversations(
  db: D1Database,
  userId: string
): Promise<DbConversation[]> {
  const result = await db
    .prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC')
    .bind(userId)
    .all<DbConversation>();
  return result.results;
}

export async function createConversation(
  db: D1Database,
  conv: { id: string; userId: string; title?: string }
): Promise<DbConversation> {
  await db
    .prepare('INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)')
    .bind(conv.id, conv.userId, conv.title ?? null)
    .run();

  return (await db
    .prepare('SELECT * FROM conversations WHERE id = ?')
    .bind(conv.id)
    .first<DbConversation>())!;
}

export async function getConversation(
  db: D1Database,
  convId: string,
  userId: string
): Promise<DbConversation | null> {
  return db
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .bind(convId, userId)
    .first<DbConversation>();
}

export async function deleteConversation(
  db: D1Database,
  convId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?')
    .bind(convId, userId)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function incrementConversationMessageCount(
  db: D1Database,
  convId: string
): Promise<void> {
  await db
    .prepare(
      "UPDATE conversations SET message_count = message_count + 1, updated_at = datetime('now') WHERE id = ?"
    )
    .bind(convId)
    .run();
}

// ─── Usage tracking ──────────────────────────────────────────────────────────

export async function getUsageToday(
  db: D1Database,
  userId: string
): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const row = await db
    .prepare('SELECT messages_sent FROM usage_tracking WHERE user_id = ? AND date = ?')
    .bind(userId, today)
    .first<{ messages_sent: number }>();
  return row?.messages_sent ?? 0;
}

export async function incrementUsage(db: D1Database, userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await db
    .prepare(
      `INSERT INTO usage_tracking (user_id, date, messages_sent)
       VALUES (?, ?, 1)
       ON CONFLICT(user_id, date) DO UPDATE SET messages_sent = messages_sent + 1`
    )
    .bind(userId, today)
    .run();
}
