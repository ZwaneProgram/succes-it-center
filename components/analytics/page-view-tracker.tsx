"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Reports each storefront page view to `/api/track`.
 *
 * Deliberately client-side rather than in middleware: a database write on every
 * request would slow down every page, and crawlers overwhelmingly do not run
 * JavaScript, so a browser beacon filters most bot traffic for free.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  // Also guards against React's development double-invoke of effects, which
  // would otherwise record every view twice while running `next dev`.
  const lastReported = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!pathname || pathname === lastReported.current) return;
    if (pathname === "/admin" || pathname.startsWith("/admin/")) return;

    lastReported.current = pathname;
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      // Survives the request if the user navigates away immediately.
      keepalive: true,
    }).catch(() => {
      // Analytics must never surface an error to the shopper.
    });
  }, [pathname]);

  return null;
}
