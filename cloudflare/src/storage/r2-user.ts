/**
 * Per-user R2 operations for conversation message storage.
 *
 * Layout:
 *   users/{uid}/conversations/{convId}/messages.jsonl
 */

export interface StoredMessage {
  ts: string;
  direction: 'in' | 'out';
  data: unknown;
}

function messagesKey(userId: string, conversationId: string): string {
  return `users/${userId}/conversations/${conversationId}/messages.jsonl`;
}

/**
 * Append a message to the JSONL file for a conversation.
 * Because R2 doesn't support append, we read-then-write.
 */
export async function appendMessage(
  bucket: R2Bucket,
  userId: string,
  conversationId: string,
  message: StoredMessage
): Promise<void> {
  const key = messagesKey(userId, conversationId);
  const line = JSON.stringify(message) + '\n';

  const existing = await bucket.get(key);
  let body = '';
  if (existing) {
    body = await existing.text();
  }
  body += line;

  await bucket.put(key, body);
}

/**
 * Read messages from a conversation, supporting cursor-based pagination.
 * Returns newest messages first (reversed).
 */
export async function readMessages(
  bucket: R2Bucket,
  userId: string,
  conversationId: string,
  options?: { limit?: number; before?: string }
): Promise<{ messages: StoredMessage[]; hasMore: boolean }> {
  const key = messagesKey(userId, conversationId);
  const obj = await bucket.get(key);

  if (!obj) {
    return { messages: [], hasMore: false };
  }

  const text = await obj.text();
  const lines = text.trim().split('\n').filter(Boolean);
  let parsed: StoredMessage[] = lines.map(l => JSON.parse(l));

  // Reverse so newest first
  parsed.reverse();

  // Apply cursor (before timestamp)
  if (options?.before) {
    const idx = parsed.findIndex(m => m.ts === options.before);
    if (idx >= 0) {
      parsed = parsed.slice(idx + 1);
    }
  }

  const limit = options?.limit ?? 50;
  const hasMore = parsed.length > limit;
  const messages = parsed.slice(0, limit);

  return { messages, hasMore };
}

/**
 * Delete all messages for a conversation.
 */
export async function deleteConversationMessages(
  bucket: R2Bucket,
  userId: string,
  conversationId: string
): Promise<void> {
  const key = messagesKey(userId, conversationId);
  await bucket.delete(key);
}
