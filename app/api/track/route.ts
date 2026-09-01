import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const COOKIE = "sv_vid";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const noContent = () => new NextResponse(null, { status: 204 });

/**
 * Keeps stored paths bounded and safe: query strings and hashes are dropped so
 * one page is one row group, and anything that is not a plain same-site path is
 * rejected outright.
 */
function normalisePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const path = raw.split(/[?#]/)[0];
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path.length > 512) return null;
  return path;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const path = normalisePath((body as { path?: unknown } | null)?.path);
  if (!path) return new NextResponse(null, { status: 400 });

  // The console is not part of the storefront's traffic, and neither is the
  // owner browsing their own shop — both would skew the numbers they're
  // looking at. Answered with 204 rather than an error: nothing went wrong.
  if (path === "/admin" || path.startsWith("/admin/")) return noContent();
  const session = await auth();
  if (session?.user?.role === "ADMIN") return noContent();

  const res = noContent();

  // An opaque random token — never derived from IP or User-Agent, so the row
  // this writes carries no personal data.
  let visitorId = req.cookies.get(COOKIE)?.value;
  if (!visitorId || !UUID.test(visitorId)) {
    visitorId = crypto.randomUUID();
    res.cookies.set({
      name: COOKIE,
      value: visitorId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });
  }

  // Set explicitly rather than leaning on the column's CURRENT_TIMESTAMP
  // default, which would follow the database session's time zone.
  await prisma.pageView.create({
    data: { visitorId, path, createdAt: new Date() },
  });

  return res;
}
