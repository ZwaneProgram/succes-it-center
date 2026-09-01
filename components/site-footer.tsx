import Link from "next/link";

import { FacebookMark } from "@/components/brand";
import { CONTACT, HOURS_ROWS } from "@/lib/contact";
import { formatMinutes } from "@/lib/opening-hours";
import { getCategories } from "@/lib/queries";

export async function SiteFooter() {
  // Read from the database rather than a hardcoded list — the previous one had
  // gone stale and four of its five links pointed at categories that no longer
  // exist, landing visitors on an empty product page.
  const categories = await getCategories();

  return (
    <footer className="mt-5 bg-ink text-white">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="mb-3.5 flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-[9px] bg-[linear-gradient(135deg,#5EE7D3,#2F6BFF)]">
              <span className="size-[11px] rounded-full border-[3px] border-white" />
            </span>
            <span className="text-lg font-bold">SUCCESS IT CENTER</span>
          </div>
          <p className="mb-4 max-w-[260px] text-sm leading-relaxed text-white/60">
            จำหน่ายและติดตั้งกล้องวงจรปิด ระบบควบคุมประตู
            และอุปกรณ์รักษาความปลอดภัย โดยทีมช่างในเชียงใหม่
          </p>
          <div className="flex gap-2.5">
            <a
              href={CONTACT.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Facebook ${CONTACT.facebookName}`}
              className="flex size-[42px] items-center justify-center rounded-[11px] bg-white/10 transition-colors hover:bg-white/20"
            >
              <FacebookMark />
            </a>
            {/* Sends people to the contact page rather than straight into LINE,
                so every channel is on offer at once. */}
            <Link
              href="/contact"
              className="flex h-[42px] items-center rounded-[11px] bg-success-line px-4 font-semibold transition-[filter] hover:brightness-105"
            >
              LINE {CONTACT.lineId}
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-3.5 text-[15px] font-bold">สินค้า</div>
          <div className="flex flex-col gap-2.5 text-sm text-white/60">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/products?cat=${encodeURIComponent(c.slug)}`}
                className="transition-colors hover:text-white"
              >
                {c.th}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3.5 text-[15px] font-bold">ติดต่อร้าน</div>

          <a
            href={CONTACT.phoneHref}
            className="font-mono text-[19px] font-bold tabular-nums transition-colors hover:text-brand-teal"
          >
            {CONTACT.phoneDisplay}
          </a>

          <address className="mt-2.5 text-sm leading-relaxed text-white/60 not-italic">
            {CONTACT.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>

          <dl className="mt-3 flex flex-col gap-1 text-[13px] text-white/60">
            {HOURS_ROWS.map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <dt>{row.label}</dt>
                <dd className="font-mono tabular-nums">
                  {row.hours
                    ? `${formatMinutes(row.hours.open)} – ${formatMinutes(row.hours.close)}`
                    : "หยุด"}
                </dd>
              </div>
            ))}
          </dl>

          <Link
            href="/contact"
            className="mt-4 flex h-[46px] items-center justify-center rounded-xl bg-success-line font-bold text-white transition-[filter] hover:brightness-105"
          >
            ติดต่อเรา
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-2.5 px-5 py-[18px] text-[13px] text-white/45">
          <span>© 2026 SUCCESS IT CENTER · สงวนลิขสิทธิ์</span>
        </div>
      </div>
    </footer>
  );
}
