import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resolveRange, type RangeKey, type ResolvedRange } from "@/lib/analytics-range";

// Re-exported so callers have a single import for the analytics feature; the
// pure date maths lives in `analytics-range` so it can be unit tested without
// a database or environment variables.
export * from "@/lib/analytics-range";

export interface DayBucket {
  day: string;
  visitors: number;
  views: number;
}

export interface TopPage {
  path: string;
  views: number;
}

export interface AnalyticsSummary {
  range: ResolvedRange;
  visitors: number;
  views: number;
  prevVisitors: number;
  prevViews: number;
  daily: DayBucket[];
  topPages: TopPage[];
}

/**
 * `createdAt` is `timestamp(3)` *without* a time zone holding UTC values, so it
 * has to be tagged as UTC before being converted — a bare
 * `AT TIME ZONE 'Asia/Bangkok'` would read the stored value as Bangkok-local
 * and shift everything the wrong way.
 */
const BANGKOK_DAY = Prisma.sql`(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok')::date`;

async function totals(start: Date, end: Date) {
  const [row] = await prisma.$queryRaw<{ visitors: number; views: number }[]>`
    SELECT COUNT(DISTINCT "visitorId")::int AS visitors,
           COUNT(*)::int AS views
    FROM "PageView"
    WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
  `;
  return { visitors: row?.visitors ?? 0, views: row?.views ?? 0 };
}

export async function getAnalytics(
  key: RangeKey,
  now: Date = new Date()
): Promise<AnalyticsSummary> {
  const range = resolveRange(key, now);
  const { start, end, prevStart, prevEnd } = range;

  const [current, previous, rows, topPages] = await Promise.all([
    totals(start, end),
    totals(prevStart, prevEnd),
    prisma.$queryRaw<{ day: string; visitors: number; views: number }[]>`
      SELECT to_char(${BANGKOK_DAY}, 'YYYY-MM-DD') AS day,
             COUNT(DISTINCT "visitorId")::int AS visitors,
             COUNT(*)::int AS views
      FROM "PageView"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<TopPage[]>`
      SELECT "path", COUNT(*)::int AS views
      FROM "PageView"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
      GROUP BY "path"
      ORDER BY views DESC, "path" ASC
      LIMIT 10
    `,
  ]);

  // Zero-fill so the chart has a bar per day rather than gaps.
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const daily = range.days.map(
    (day) => byDay.get(day) ?? { day, visitors: 0, views: 0 }
  );

  return {
    range,
    visitors: current.visitors,
    views: current.views,
    prevVisitors: previous.visitors,
    prevViews: previous.views,
    daily,
    topPages,
  };
}
