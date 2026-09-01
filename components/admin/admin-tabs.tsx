"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Tags } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "สินค้า", icon: Package },
  { href: "/admin/categories", label: "หมวดหมู่", icon: Tags },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 rounded-xl border border-line bg-secondary p-1">
      {TABS.map((tab) => {
        // /admin also covers /admin/new and /admin/[id]/edit; /admin/categories
        // is the only other branch, so an exact-or-prefix check is enough.
        const active =
          tab.href === "/admin"
            ? !pathname.startsWith("/admin/categories")
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold transition-colors sm:flex-none",
              active
                ? "bg-ink text-white shadow-[0_4px_14px_rgba(14,27,42,.18)]"
                : "text-ink hover:bg-white"
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
