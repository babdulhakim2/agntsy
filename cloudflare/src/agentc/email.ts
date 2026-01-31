/**
 * Email delivery for login codes.
 *
 * MVP: codes are stored in D1 and logged. In development mode,
 * the code is returned directly in the API response so the frontend
 * can auto-fill it.
 *
 * Production: integrate MailChannels or Cloudflare Email Workers here.
 */

export async function sendLoginCode(
  email: string,
  code: string,
  _devMode: boolean
): Promise<void> {
  // In a real deployment, send the code via email here.
  // For MVP / dev, we just log it — the API response includes a hint.
  console.log(`[agentc:email] Login code for ${email}: ${code}`);
}
