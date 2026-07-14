import { describe, it, expect } from "bun:test";
import { formatRelativeTime } from "./chat-relative-time";

const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime();
const ago = (ms: number) => NOW - ms;
const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

describe("formatRelativeTime", () => {
  it("shows a just-now label under a minute", () => {
    expect(formatRelativeTime(ago(5 * SEC), NOW)).toBe("เมื่อครู่");
    expect(formatRelativeTime(ago(59 * SEC), NOW)).toBe("เมื่อครู่");
  });

  it("shows whole minutes under an hour", () => {
    expect(formatRelativeTime(ago(1 * MIN), NOW)).toBe("1 นาที");
    expect(formatRelativeTime(ago(45 * MIN), NOW)).toBe("45 นาที");
  });

  it("shows whole hours under a day", () => {
    expect(formatRelativeTime(ago(1 * HOUR), NOW)).toBe("1 ชม.");
    expect(formatRelativeTime(ago(23 * HOUR), NOW)).toBe("23 ชม.");
  });

  it("shows whole days under a week", () => {
    expect(formatRelativeTime(ago(1 * DAY), NOW)).toBe("1 วัน");
    expect(formatRelativeTime(ago(6 * DAY), NOW)).toBe("6 วัน");
  });

  it("shows whole weeks under ~a month", () => {
    expect(formatRelativeTime(ago(1 * WEEK), NOW)).toBe("1 สัปดาห์");
    expect(formatRelativeTime(ago(4 * WEEK), NOW)).toBe("4 สัปดาห์");
  });

  it("shows whole months under a year", () => {
    expect(formatRelativeTime(ago(35 * DAY), NOW)).toBe("1 เดือน");
    expect(formatRelativeTime(ago(300 * DAY), NOW)).toBe("10 เดือน");
  });

  it("shows whole years beyond a year", () => {
    expect(formatRelativeTime(ago(400 * DAY), NOW)).toBe("1 ปี");
    expect(formatRelativeTime(ago(800 * DAY), NOW)).toBe("2 ปี");
  });

  it("is defensive about a future timestamp (clock skew)", () => {
    expect(formatRelativeTime(NOW + 10 * SEC, NOW)).toBe("เมื่อครู่");
  });
});
