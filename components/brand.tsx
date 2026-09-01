import Link from "next/link";

import { cn } from "@/lib/utils";

/** SUCCESS IT gradient logo mark + wordmark. */
export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("flex shrink-0 items-center gap-2.5", className)}
    >
      <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#5EE7D3,#2F6BFF)] shadow-[0_4px_14px_rgba(47,107,255,.28)]">
        <span className="size-3 rounded-full border-[3px] border-white" />
      </span>
      <span className="text-xl font-bold tracking-tight text-ink">
        <span className="text-brand-blue">SUCCESS</span> IT
      </span>
    </Link>
  );
}

/** Facebook "f" mark — lucide dropped its brand glyphs, so it is inlined. */
export function FacebookMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn("size-5", className)}
    >
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.45 1.55-1.45h1.65V3.68c-.29-.04-1.27-.12-2.42-.12-2.4 0-4.03 1.46-4.03 4.15V9.9H7.5V13h2.75v8h3.25Z" />
    </svg>
  );
}
