# Visitor Analytics — Design

**Date:** 2026-09-01
**Goal:** Count how many people visit the storefront in a given period and show it in the admin console, with switchable date ranges.

## Scope

In scope:

- Record a row per page view from real browsers.
- Identify returning visitors anonymously so "how many people" is a true unique count.
- An admin-only page showing unique visitors, page views, change vs. the previous
  period, a daily bar chart, and the most-visited pages.
- Range switching: this month, last month, last 7 days, last 30 days.

Out of scope (flagged to the user, deliberately not built):

- **Cookie consent banner.** The site has none today. If this launches to Thai
  customers, PDPA may require one. That is its own piece of work.
- Rate limiting / abuse protection on the tracking endpoint.
- Data retention or pruning of old rows.
- Referrer, country, device, or campaign breakdowns.

## Visitor identity

A random UUID stored in a first-party cookie (`sv_vid`).

The alternative considered was a Plausible-style daily-rotating hash of IP +
User-Agent, which needs no cookie. It was rejected because the daily rotation
makes one person who visits on ten days count as ten people, which is exactly
the question this feature exists to answer.

The UUID is generated with `crypto.randomUUID()` and is **not derived from any
request attribute**. The database never stores an IP address or User-Agent, so
the stored data contains no personal identifiers — only an opaque random token.

Cookie settings: `httpOnly`, `sameSite=lax`, `secure` in production, `path=/`,
`maxAge` 180 days.

## Data model

```prisma
model PageView {
  id        Int      @id @default(autoincrement())
  visitorId String
  path      String
  createdAt DateTime @default(now())

  @@index([createdAt])
  @@index([visitorId, createdAt])
}
```

One row per page view. Unique visitors are `COUNT(DISTINCT "visitorId")` over a
time window. No aggregate/rollup table — at this site's traffic a raw table is
simpler and stays accurate for any range.

## Recording a view

A small client component in the root layout watches `usePathname()` and fires
`POST /api/track` with `{ path }` on each path change, using `fetch` with
`keepalive: true`.

Why client-side rather than in `proxy.ts` middleware:

- Middleware runs on every request including assets and prefetches; a DB write
  there would slow down every page.
- Bots and crawlers overwhelmingly do not run JavaScript, so a browser beacon
  filters most of them for free.

The route handler:

1. Rejects non-string paths, paths not starting with `/`, protocol-relative
   paths (`//`), and paths longer than 512 characters.
2. Ignores anything under `/admin`.
3. Ignores requests from a signed-in ADMIN user, so the owner's own browsing
   does not inflate the numbers.
4. Reads `sv_vid`; if absent or malformed, mints a new UUID and sets the cookie
   on the response.
5. Inserts the `PageView` row and returns `204`.

Only the pathname is stored — query strings are dropped before saving to keep
path cardinality bounded.

## Querying

`lib/analytics.ts` exposes:

- `resolveRange(key, now)` — pure function returning `{ start, end, prevStart, prevEnd, label }`.
- `getAnalytics(key)` — totals, previous-period totals, daily series, top pages.

**Timezone.** All day and month boundaries are computed in `Asia/Bangkok`
(fixed UTC+7; Thailand has had no DST since 1952). Computing them in UTC would
shift every boundary by 7 hours and put late-evening visits on the wrong day.
`resolveRange` converts Bangkok-local boundaries into UTC instants; the daily
grouping query uses `AT TIME ZONE 'Asia/Bangkok'`.

Days with no traffic are filled in as zero so the chart has no gaps.

## Admin UI

A third tab, "สถิติ", at `/admin/analytics`. The existing `/admin` layout
already redirects non-ADMIN users, so no extra guard is needed.

- Three stat cards: unique visitors, page views, views per visitor — each with
  the percentage change against the equivalent previous period.
- A daily bar chart, hand-written as SVG/CSS. No charting dependency.
- A table of the ten most-visited paths.
- Range selector as links that set `?range=`, so the page stays a server
  component and each range is shareable/bookmarkable.

`AdminTabs` needs its active-tab logic updated: it currently treats "not
`/admin/categories`" as "products", which would light up the products tab on
the analytics route. It becomes an explicit longest-prefix match.

## Testing

`lib/analytics.test.ts` (vitest, matching the existing `cart-merge.test.ts`)
covers `resolveRange`, which holds all the fiddly logic: month boundaries, year
rollover, the previous-period window, and the Bangkok offset.

The query layer and UI are verified by running the page.
