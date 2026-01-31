import { SignJWT, jwtVerify } from 'jose';
import type { SessionClaims } from './types';

/**
 * Create a session JWT signed with HS256.
 */
export async function createSessionToken(
  claims: { jti: string; sub: string; email: string },
  secret: string,
  expiresInSeconds: number
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(claims.jti)
    .setSubject(claims.sub)
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(key);
}

/**
 * Verify a session JWT and return its claims.
 * Throws if the token is invalid or expired.
 */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<SessionClaims> {
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, {
    algorithms: ['HS256'],
  });

  return {
    jti: payload.jti!,
    sub: payload.sub!,
    email: payload.email as string,
    iat: payload.iat!,
    exp: payload.exp!,
  };
}
