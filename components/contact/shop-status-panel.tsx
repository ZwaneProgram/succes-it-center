"use client";

import * as React from "react";

import { HOURS_ROWS, OPENING_HOURS, WEEKDAY_NAMES } from "@/lib/contact";
import { formatMinutes, shopStatus } from "@/lib/opening-hours";
import { cn } from "@/lib/utils";

/**
 * The page's centrepiece: a live readout of whether the shop is open right now.
 *
 * It answers the question a customer actually has before they call, and a live
 * status board is the native idiom for a security shop. `initialNow` comes from
 * the server so the first paint is already correct and matches on hydration;
 * the interval only keeps it honest afterwards.
 */
export function ShopStatusPanel({ initialNow }: { initialNow: number }) {
  const [now, setNow] = React.useState(initialNow);

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const status = shopStatus(OPENING_HOURS, new Date(now));
  const { isOpen, today, nextOpening } = status;

  return (
    <div className="sv-dots-light relative overflow-hidden rounded-[22px] bg-ink text-white shadow-[0_18px_40px_rgba(14,27,42,.22)]">
      <div className="relative p-6">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-white/45">
          <span className="relative flex size-2">
            {isOpen && (
              <span className="absolute inline-flex size-2 animate-sv-ping rounded-full bg-brand-teal motion-reduce:animate-none" />
            )}
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                isOpen ? "bg-brand-teal" : "bg-white/30"
              )}
            />
          </span>
          สถานะร้าน
        </div>

        <div className="mt-3 flex items-baseline gap-3">
          <span
            className={cn(
              "font-sans text-[34px] leading-none font-bold tracking-tight",
              isOpen ? "text-brand-teal" : "text-white"
            )}
          >
            {isOpen ? "เปิดอยู่" : "ปิดอยู่"}
          </span>
          <span className="font-mono text-[15px] tabular-nums text-white/45">
            {formatMinutes(status.minutesNow)} น.
          </span>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-white/60">
          {isOpen && today
            ? `วันนี้เปิดถึง ${formatMinutes(today.close)} น.`
            : nextOpening
              ? `เปิดอีกครั้ง ${whenLabel(nextOpening.daysAhead, nextOpening.weekday)} ${formatMinutes(nextOpening.minutes)} น.`
              : "ดูเวลาทำการด้านล่าง"}
        </p>
      </div>

      <div className="relative border-t border-white/10 p-6 pt-5">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[.16em] text-white/45">
          เวลาทำการ
        </div>
        <dl className="flex flex-col gap-0.5">
          {HOURS_ROWS.map((row) => {
            // Highlighting today turns a static table into something the
            // reader can locate themselves in at a glance.
            const isToday = row.weekdays.includes(status.weekday as never);
            return (
              <div
                key={row.label}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                  isToday ? "bg-white/10" : "text-white/70"
                )}
              >
                <dt className={cn(isToday && "font-semibold text-white")}>
                  {row.label}
                  {isToday && (
                    <span className="ml-2 text-[11px] font-normal text-brand-teal">
                      วันนี้
                    </span>
                  )}
                </dt>
                <dd
                  className={cn(
                    "font-mono text-[13px] tabular-nums",
                    row.hours
                      ? isToday
                        ? "font-semibold text-white"
                        : "text-white/70"
                      : "text-white/35"
                  )}
                >
                  {row.hours
                    ? `${formatMinutes(row.hours.open)} – ${formatMinutes(row.hours.close)}`
                    : "หยุด"}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}

function whenLabel(daysAhead: number, weekday: number): string {
  if (daysAhead === 0) return "วันนี้";
  if (daysAhead === 1) return "พรุ่งนี้";
  return `วัน${WEEKDAY_NAMES[weekday]}`;
}
