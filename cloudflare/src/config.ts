/**
 * Configuration constants for Moltbot Sandbox
 */

/** Port that the Moltbot gateway listens on inside the container */
export const MOLTBOT_PORT = 18789;

/** Maximum time to wait for Moltbot to start (3 minutes) */
export const STARTUP_TIMEOUT_MS = 180_000;

/** Mount path for R2 persistent storage inside the container */
export const R2_MOUNT_PATH = '/data/moltbot';

/** R2 bucket name for persistent storage */
export const R2_BUCKET_NAME = 'moltbot-data';

// ─── Agent C multi-user constants ────────────────────────────────────────────

/** Session JWT lifetime in seconds (7 days) */
export const AGENTC_SESSION_DURATION_S = 7 * 24 * 60 * 60;

/** Auth code validity in minutes */
export const AGENTC_CODE_EXPIRY_MIN = 10;

/** Daily message limit per user (free tier) */
export const AGENTC_DAILY_MESSAGE_LIMIT = 50;
