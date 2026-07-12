import { test, expect, describe } from 'bun:test';
import { hasSeenGreeting, markGreetingSeen } from './first-visit';

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  };
}

describe('first-visit greeting flag', () => {
  test('has not been seen by default', () => {
    expect(hasSeenGreeting(fakeStorage())).toBe(false);
  });

  test('is marked seen after markGreetingSeen', () => {
    const storage = fakeStorage();
    markGreetingSeen(storage);
    expect(hasSeenGreeting(storage)).toBe(true);
  });

  test('is unaffected by unrelated stored keys', () => {
    const storage = fakeStorage();
    storage.setItem('some-other-flag', '1');
    expect(hasSeenGreeting(storage)).toBe(false);
  });
});
