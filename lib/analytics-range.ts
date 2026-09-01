/**
 * Thailand has been a fixed UTC+7 with no DST since 1952, so the offset can be
 * a constant instead of an Intl round-trip. Every day/month boundary in here is
 * a *Bangkok-local* boundary expressed as the UTC instant it happens at —
 * computing them in UTC would shift each one by 7 hours and file late-evening
 * visits under the wrong day.
 */
const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const RANGE_KEYS = [
  "this-month",
  "last-month",
  "last-7-days",
  "last-30-days",
] as const;

export type RangeKey = (typeof RANGE_KEYS)[number];

export const RANGE_LABELS: Record<RangeKey, string> = {
  "this-month": "เดือนนี้",
  "last-month": "เดือนที่แล้ว",
  "last-7-days": "7 วันล่าสุด",
  "last-30-days": "30 วันล่าสุด",
};

/** Label for the window each range is compared against. */
const COMPARE_LABELS: Record<RangeKey, string> = {
  "this-month": "ช่วงเดียวกันเดือนที่แล้ว",
  "last-month": "เดือนก่อนหน้า",
  "last-7-days": "7 วันก่อนหน้า",
  "last-30-days": "30 วันก่อนหน้า",
};

export interface ResolvedRange {
  key: RangeKey;
  label: string;
  compareLabel: string;
  /** Inclusive start, as a UTC instant. */
  start: Date;
  /** Exclusive end, as a UTC instant. */
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  /** Bangkok-local `YYYY-MM-DD` for every day in the window, used to zero-fill. */
  days: string[];
}

export function parseRangeKey(value: string | undefined | null): RangeKey {
  return RANGE_KEYS.includes(value as RangeKey)
    ? (value as RangeKey)
    : "this-month";
}

/** Bangkok-local calendar parts for a UTC instant. */
function bangkokParts(instant: Date) {
  const shifted = new Date(instant.getTime() + BKK_OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
  };
}

/**
 * UTC instant at which the given Bangkok-local date begins. Out-of-range parts
 * (month 12, day 0, day -14, …) normalise the same way `Date.UTC` does, which
 * is what makes the month/year rollovers below fall out for free.
 */
function bangkokMidnight(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d) - BKK_OFFSET_MS);
}

const pad = (n: number) => String(n).padStart(2, "0");

function dayKey(y: number, m: number, d: number): string {
  const t = new Date(Date.UTC(y, m, d));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

function listDays(start: Date, end: Date): string[] {
  const { y, m, d } = bangkokParts(start);
  const count = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  return Array.from({ length: count }, (_, i) => dayKey(y, m, d + i));
}

function build(
  key: RangeKey,
  start: Date,
  end: Date,
  prevStart: Date,
  prevEnd: Date
): ResolvedRange {
  return {
    key,
    label: RANGE_LABELS[key],
    compareLabel: COMPARE_LABELS[key],
    start,
    end,
    prevStart,
    prevEnd,
    days: listDays(start, end),
  };
}

export function resolveRange(key: RangeKey, now: Date = new Date()): ResolvedRange {
  const { y, m, d } = bangkokParts(now);
  // Today is still accumulating, so windows that include it end at tomorrow's
  // midnight rather than the end of the calendar period — otherwise the chart
  // would trail off into empty future days.
  const tomorrow = bangkokMidnight(y, m, d + 1);

  switch (key) {
    case "last-month": {
      const start = bangkokMidnight(y, m - 1, 1);
      const end = bangkokMidnight(y, m, 1);
      return build(key, start, end, bangkokMidnight(y, m - 2, 1), start);
    }

    case "last-7-days":
    case "last-30-days": {
      const span = key === "last-7-days" ? 7 : 30;
      const start = bangkokMidnight(y, m, d + 1 - span);
      return build(
        key,
        start,
        tomorrow,
        bangkokMidnight(y, m, d + 1 - span * 2),
        start
      );
    }

    case "this-month":
    default: {
      const start = bangkokMidnight(y, m, 1);
      // `d` days of this month have elapsed; compare against the same number of
      // days at the start of last month so the percentages are like-for-like.
      return build(
        key,
        start,
        tomorrow,
        bangkokMidnight(y, m - 1, 1),
        bangkokMidnight(y, m - 1, 1 + d)
      );
    }
  }
}

/**
 * Percentage change, or `null` when there is no baseline to compare against —
 * "+100%" from a base of zero would read as growth that never happened.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
