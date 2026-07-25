/**
 * Truth table for the one predicate both the planner and the screenshot worker use (#197).
 * This file is the guard against the two sides drifting apart again.
 */
import { describe, it, expect } from 'bun:test';
import { needsCoverCapture } from '../src/github/capture-eligibility';

describe('needsCoverCapture', () => {
  it('captures when there is no cover yet, whatever the triggers say', () => {
    expect(
      needsCoverCapture({
        hasCover: false,
        lastCompletedTrigger: 'push:same',
        incomingTrigger: 'push:same',
      }),
    ).toBe(true);
  });

  it('captures when the incoming trigger differs from the last completed one', () => {
    expect(
      needsCoverCapture({
        hasCover: true,
        lastCompletedTrigger: 'push:old',
        incomingTrigger: 'push:new',
      }),
    ).toBe(true);
  });

  it('skips when the last completed capture used this very trigger', () => {
    expect(
      needsCoverCapture({
        hasCover: true,
        lastCompletedTrigger: 'deploy:dpl_1',
        incomingTrigger: 'deploy:dpl_1',
      }),
    ).toBe(false);
  });

  it('captures the first time a covered project sees any trigger', () => {
    expect(
      needsCoverCapture({
        hasCover: true,
        lastCompletedTrigger: null,
        incomingTrigger: 'push:new',
      }),
    ).toBe(true);
  });

  it('skips a covered project when the event carries no usable trigger', () => {
    for (const incomingTrigger of [null, '']) {
      expect(
        needsCoverCapture({
          hasCover: true,
          lastCompletedTrigger: 'push:old',
          incomingTrigger,
        }),
      ).toBe(false);
    }
  });

  it('force overrides every gate', () => {
    expect(
      needsCoverCapture({
        hasCover: true,
        lastCompletedTrigger: 'push:same',
        incomingTrigger: 'push:same',
        force: true,
      }),
    ).toBe(true);
  });
});
