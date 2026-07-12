import { test, expect, describe } from 'bun:test';
import { buildProjectGreetingMessage } from './project-chat';

describe('buildProjectGreetingMessage', () => {
  test('asks for more detail about the named project', () => {
    const msg = buildProjectGreetingMessage('MangaDock');
    expect(msg).toContain('MangaDock');
  });

  test('is phrased as a question a visitor would ask', () => {
    const msg = buildProjectGreetingMessage('MangaDock');
    expect(msg).toMatch(/รายละเอียด/);
  });
});
