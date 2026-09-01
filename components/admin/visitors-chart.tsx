import type { DayBucket } from "@/lib/analytics";

const nf = new Intl.NumberFormat("th-TH");

/** `2026-09-15` -> `15/9`, the compact form that fits under a thin bar. */
function shortDay(day: string): string {
  const [, m, d] = day.split("-");
  return `${Number(d)}/${Number(m)}`;
}

/**
 * A single series of daily counts, so: one hue, no legend (the heading names
 * it), recessive axis, and labels on only a few days — a label under all 30
 * bars would collide into noise.
 */
export function VisitorsChart({ daily }: { daily: DayBucket[] }) {
  const max = Math.max(...daily.map((d) => d.visitors), 0);

  if (max === 0) {
    return (
      <div className="flex h-[188px] items-center justify-center text-sm text-muted-foreground">
        ยังไม่มีข้อมูลในช่วงนี้
      </div>
    );
  }

  // Aim for ~8 labels regardless of whether the range is 7 or 30 days.
  const labelEvery = Math.max(1, Math.ceil(daily.length / 8));

  return (
    <div>
      <div className="flex h-[188px] items-end gap-[2px]">
        {daily.map((d) => {
          // Floor at 2% so a day with traffic never renders as nothing.
          const pct = d.visitors === 0 ? 0 : Math.max(2, (d.visitors / max) * 100);
          return (
            <div
              key={d.day}
              className="group relative flex h-full flex-1 items-end"
            >
              <div
                className="w-full rounded-t-[4px] bg-brand-blue/85 transition-colors group-hover:bg-brand-blue"
                style={{ height: `${pct}%` }}
                role="img"
                aria-label={`${d.day}: ${d.visitors} คน, ${d.views} ครั้ง`}
              />
              {/* Hover detail — the per-bar read that a compact chart needs. */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[12px] leading-tight text-white shadow-lg group-hover:block">
                <div className="font-semibold">{shortDay(d.day)}</div>
                <div className="text-white/75">{nf.format(d.visitors)} คน</div>
                <div className="text-white/75">{nf.format(d.views)} ครั้ง</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-[2px] border-t border-line pt-2">
        {daily.map((d, i) => (
          <div
            key={d.day}
            className="min-w-0 flex-1 text-center text-[10px] text-muted-foreground"
          >
            {i % labelEvery === 0 ? shortDay(d.day) : " "}
          </div>
        ))}
      </div>
    </div>
  );
}
