import { describe, it, expect } from 'bun:test';
import { isUuid } from '../src/chat/conversation-log.service';

// conversations.session_id is a uuid column; a non-uuid sessionId makes Postgres
// throw "invalid input syntax for type uuid" (seen with the e2e session ids).
// isUuid gates the query so a malformed sessionId returns [] / skips logging
// instead of a failed query + WARN.
describe('isUuid', () => {
  it('accepts a real randomUUID()-shaped id', () => {
    expect(isUuid('3f1b2c4d-5e6f-4a8b-9c0d-1e2f3a4b5c6d')).toBe(true);
    expect(isUuid('00000000-0000-0000-0000-000000000000')).toBe(true);
  });

  it('rejects the non-uuid session ids that broke the query', () => {
    expect(isUuid('e2e-typing-test')).toBe(false);
    expect(isUuid('e2e-project-chat')).toBe(false);
    expect(isUuid('')).toBe(false);
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('3f1b2c4d-5e6f-4a8b-9c0d-1e2f3a4b5c6')).toBe(false); // too short
  });
});
