import { test, expect, describe } from 'bun:test';
import { validateContact } from './contact-validation';

describe('validateContact', () => {
  test('accepts a complete valid submission', () => {
    const r = validateContact({
      name: 'สมชาย',
      email: 'somchai@example.com',
      projectType: 'saas',
      message: 'อยากทำระบบ SaaS สำหรับธุรกิจ',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.name).toBe('สมชาย');
      expect(r.value.email).toBe('somchai@example.com');
    }
  });

  test('rejects a missing name', () => {
    const r = validateContact({ name: '  ', email: 'a@b.com', message: 'hello there' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.name).toBeTruthy();
  });

  test('rejects an invalid email', () => {
    const r = validateContact({ name: 'A', email: 'not-an-email', message: 'hello there' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.email).toBeTruthy();
  });

  test('rejects a too-short message', () => {
    const r = validateContact({ name: 'A', email: 'a@b.com', message: 'hi' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.message).toBeTruthy();
  });

  test('trims whitespace on accepted values', () => {
    const r = validateContact({
      name: '  Nid  ',
      email: '  nid@example.com  ',
      message: '  I want a booking system please  ',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.name).toBe('Nid');
      expect(r.value.email).toBe('nid@example.com');
      expect(r.value.message).toBe('I want a booking system please');
    }
  });

  test('projectType is optional and defaults to empty', () => {
    const r = validateContact({ name: 'A', email: 'a@b.com', message: 'a valid message here' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.projectType).toBe('');
  });
});
