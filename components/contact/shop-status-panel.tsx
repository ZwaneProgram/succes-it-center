"use client";

import * as React from "react";

import { HOURS_ROWS, OPENING_HOURS, WEEKDAY_NAMES } from "@/lib/contact";
import { formatMinutes, shopStatus } from "@/lib/opening-hours";
import { cn } from "@/lib/utils";

/**
 * The page's centrepiece: a live readout of whether the shop is open right now.
 *
 * It answers the question a customer actually has before they call. `initialNow`
 * comes from the server so the first paint is already correct and matches on
 * hydration; the interval only keeps it honest afterwards.
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
    <div className="overflow-hidden rounded-[22px] border border-line bg-card shadow-[0_10px_30px_rgba(14,27,42,.06)]">
      {/* The banner carries the state: a green wash when the shop is open, a
          quiet neutral one when it is not. */}
      <div
        className={cn(
          "sv-dots relative border-b border-line p-6 transition-colors",
          isOpen ? "bg-emerald-50" : "bg-surface"
        )}
      >
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[.16em] text-muted-foreground uppercase">
          <span className="relative flex size-2">
            {isOpen && (
              <span className="absolute inline-flex size-2 animate-sv-ping rounded-full bg-emerald-500 motion-reduce:animate-none" />
            )}
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                isOpen ? "bg-emerald-500" : "bg-muted-ink/35"
              )}
            />
          </span>
          สถานะร้าน
        </div>

        <div className="mt-2.5 flex items-baseline gap-3">
          <span
            className={cn(
              "text-[34px] leading-none font-bold tracking-tight",
              isOpen ? "text-emerald-600" : "text-ink"
            )}
          >
            {isOpen ? "เปิดอยู่" : "ปิดอยู่"}
          </span>
          <span className="font-mono text-[15px] tabular-nums text-muted-foreground">
            {formatMinutes(status.minutesNow)} น.
          </span>
        </div>

        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {isOpen && today
            ? `วันนี้เปิดถึง ${formatMinutes(today.close)} น.`
            : nextOpening
              ? `เปิดอีกครั้ง ${whenLabel(nextOpening.daysAhead, nextOpening.weekday)} ${formatMinutes(nextOpening.minutes)} น.`
              : "ดูเวลาทำการด้านล่าง"}
        </p>
      </div>

      <div className="p-6 pt-5">
        <div className="mb-3 text-[11px] font-bold tracking-[.16em] text-muted-foreground uppercase">
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
                  "flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px]",
                  isToday ? "bg-accent" : ""
                )}
              >
                <dt
                  className={cn(
                    isToday ? "font-semibold text-ink" : "text-muted-foreground"
                  )}
                >
                  {row.label}
                  {isToday && (
                    <span className="ml-2 text-[11px] font-semibold text-brand-blue">
                      วันนี้
                    </span>
                  )}
                </dt>
                <dd
                  className={cn(
                    "font-mono text-[13px] tabular-nums",
                    row.hours
                      ? isToday
                        ? "font-semibold text-ink"
                        : "text-muted-foreground"
                      : "text-muted-ink/50"
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
