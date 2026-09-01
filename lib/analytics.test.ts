import { describe, expect, it } from "vitest";

import { parseRangeKey, resolveRange } from "./analytics-range";

/**
 * Bangkok is a fixed UTC+7 (no DST since 1952), so a Bangkok-local midnight is
 * always 17:00 UTC on the previous calendar day. Every expectation below is
 * written as that UTC instant on purpose — it is the thing that would silently
 * break if the offset were dropped.
 */
const utc = (iso: string) => new Date(iso);

describe("parseRangeKey", () => {
  it("accepts the four supported keys", () => {
    expect(parseRangeKey("this-month")).toBe("this-month");
    expect(parseRangeKey("last-month")).toBe("last-month");
    expect(parseRangeKey("last-7-days")).toBe("last-7-days");
    expect(parseRangeKey("last-30-days")).toBe("last-30-days");
  });

  it("falls back to this-month for anything else", () => {
    expect(parseRangeKey(undefined)).toBe("this-month");
    expect(parseRangeKey("")).toBe("this-month");
    expect(parseRangeKey("last-year")).toBe("this-month");
  });
});

describe("resolveRange · this-month", () => {
  // 2026-09-15 17:00 Bangkok
  const now = utc("2026-09-15T10:00:00.000Z");

  it("starts at Bangkok midnight on the 1st", () => {
    expect(resolveRange("this-month", now).start).toEqual(
      utc("2026-08-31T17:00:00.000Z")
    );
  });

  it("ends at the start of tomorrow, not the end of the month", () => {
    // Today is still accumulating; future days must not appear as zero bars.
    expect(resolveRange("this-month", now).end).toEqual(
      utc("2026-09-15T17:00:00.000Z")
    );
  });

  it("lists one day per elapsed day", () => {
    const { days } = resolveRange("this-month", now);
    expect(days).toHaveLength(15);
    expect(days[0]).toBe("2026-09-01");
    expect(days[14]).toBe("2026-09-15");
  });

  it("compares against the same number of days last month", () => {
    const { prevStart, prevEnd } = resolveRange("this-month", now);
    expect(prevStart).toEqual(utc("2026-07-31T17:00:00.000Z")); // 1 Aug BKK
    expect(prevEnd).toEqual(utc("2026-08-15T17:00:00.000Z")); // 16 Aug BKK
  });
});

describe("resolveRange · Bangkok day boundary", () => {
  it("treats 16:59 UTC as still the previous Bangkok day", () => {
    const { days } = resolveRange("this-month", utc("2026-09-15T16:59:00.000Z"));
    expect(days.at(-1)).toBe("2026-09-15");
  });

  it("rolls over to the next Bangkok day at 17:00 UTC", () => {
    const { days } = resolveRange("this-month", utc("2026-09-15T17:00:00.000Z"));
    expect(days.at(-1)).toBe("2026-09-16");
  });
});

describe("resolveRange · last-month", () => {
  const now = utc("2026-09-15T10:00:00.000Z");

  it("spans the whole previous calendar month", () => {
    const { start, end, days } = resolveRange("last-month", now);
    expect(start).toEqual(utc("2026-07-31T17:00:00.000Z")); // 1 Aug BKK
    expect(end).toEqual(utc("2026-08-31T17:00:00.000Z")); // 1 Sep BKK
    expect(days).toHaveLength(31);
  });

  it("compares against the calendar month before it", () => {
    const { prevStart, prevEnd } = resolveRange("last-month", now);
    expect(prevStart).toEqual(utc("2026-06-30T17:00:00.000Z")); // 1 Jul BKK
    expect(prevEnd).toEqual(utc("2026-07-31T17:00:00.000Z")); // 1 Aug BKK
  });

  it("crosses the year boundary", () => {
    const { start, end } = resolveRange(
      "last-month",
      utc("2026-01-10T10:00:00.000Z")
    );
    expect(start).toEqual(utc("2025-11-30T17:00:00.000Z")); // 1 Dec 2025 BKK
    expect(end).toEqual(utc("2025-12-31T17:00:00.000Z")); // 1 Jan 2026 BKK
  });
});

describe("resolveRange · rolling windows", () => {
  const now = utc("2026-09-15T10:00:00.000Z");

  it("last-7-days covers 7 days ending with today", () => {
    const { start, end, days } = resolveRange("last-7-days", now);
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-09-09");
    expect(days[6]).toBe("2026-09-15");
    expect(start).toEqual(utc("2026-09-08T17:00:00.000Z"));
    expect(end).toEqual(utc("2026-09-15T17:00:00.000Z"));
  });

  it("last-7-days compares against the 7 days before that", () => {
    const { prevStart, prevEnd } = resolveRange("last-7-days", now);
    expect(prevStart).toEqual(utc("2026-09-01T17:00:00.000Z"));
    expect(prevEnd).toEqual(utc("2026-09-08T17:00:00.000Z"));
  });

  it("last-30-days spans 30 days and reaches back into the previous month", () => {
    const { days } = resolveRange("last-30-days", now);
    expect(days).toHaveLength(30);
    expect(days[0]).toBe("2026-08-17");
    expect(days.at(-1)).toBe("2026-09-15");
  });
});

describe("resolveRange · invariants", () => {
  const now = utc("2026-03-07T04:00:00.000Z");

  it("never produces an empty or inverted window", () => {
    for (const key of [
      "this-month",
      "last-month",
      "last-7-days",
      "last-30-days",
    ] as const) {
      const r = resolveRange(key, now);
      expect(r.end.getTime()).toBeGreaterThan(r.start.getTime());
      expect(r.prevEnd.getTime()).toBeGreaterThan(r.prevStart.getTime());
      expect(r.prevEnd.getTime()).toBeLessThanOrEqual(r.start.getTime());
      expect(r.days.length).toBeGreaterThan(0);
    }
  });

  it("handles the 1st of the month, when only one day has elapsed", () => {
    const r = resolveRange("this-month", utc("2026-03-01T05:00:00.000Z"));
    expect(r.days).toEqual(["2026-03-01"]);
    expect(r.prevStart).toEqual(utc("2026-01-31T17:00:00.000Z")); // 1 Feb BKK
    expect(r.prevEnd).toEqual(utc("2026-02-01T17:00:00.000Z")); // 2 Feb BKK
  });
});
