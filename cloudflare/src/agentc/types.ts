/**
 * Agent C multi-user types
 */

export interface AgentCUser {
  id: string;
  email: string;
  displayName: string | null;
  deviceId: string;
  status: string;
  tier: string;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface SessionClaims {
  /** JWT ID — matches sessions.id in D1 */
  jti: string;
  /** Subject — user ID */
  sub: string;
  /** User email */
  email: string;
  /** Issued at (epoch seconds) */
  iat: number;
  /** Expiration (epoch seconds) */
  exp: number;
}
