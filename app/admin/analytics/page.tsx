import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { VisitorsChart } from "@/components/admin/visitors-chart";
import {
  getAnalytics,
  parseRangeKey,
  percentChange,
  RANGE_KEYS,
  RANGE_LABELS,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";

// Traffic numbers are only useful live, so never serve them from a cache.
export const dynamic = "force-dynamic";

const nf = new Intl.NumberFormat("th-TH");

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const key = parseRangeKey(range);
  const data = await getAnalytics(key);

  const perVisitor =
    data.visitors === 0 ? 0 : Math.round((data.views / data.visitors) * 10) / 10;
  const prevPerVisitor =
    data.prevVisitors === 0
      ? 0
      : Math.round((data.prevViews / data.prevVisitors) * 10) / 10;

  return (
    <div className="flex flex-col gap-4">
      {/* Range selector — plain links, so each range is bookmarkable and the
          page stays a server component. */}
      <nav className="flex flex-wrap gap-1 rounded-xl border border-line bg-secondary p-1">
        {RANGE_KEYS.map((k) => (
          <Link
            key={k}
            href={k === "this-month" ? "/admin/analytics" : `/admin/analytics?range=${k}`}
            aria-current={k === key ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-[10px] px-3.5 text-[13px] font-semibold transition-colors",
              k === key
                ? "bg-ink text-white shadow-[0_4px_14px_rgba(14,27,42,.18)]"
                : "text-ink hover:bg-white"
            )}
          >
            {RANGE_LABELS[k]}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="ผู้เข้าชม"
          value={nf.format(data.visitors)}
          unit="คน"
          change={percentChange(data.visitors, data.prevVisitors)}
          compareLabel={data.range.compareLabel}
        />
        <StatCard
          label="เปิดหน้าเว็บ"
          value={nf.format(data.views)}
          unit="ครั้ง"
          change={percentChange(data.views, data.prevViews)}
          compareLabel={data.range.compareLabel}
        />
        <StatCard
          label="เฉลี่ยต่อคน"
          value={String(perVisitor)}
          unit="หน้า"
          change={percentChange(perVisitor, prevPerVisitor)}
          compareLabel={data.range.compareLabel}
        />
      </div>

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-1 text-[15px] font-bold text-ink">ผู้เข้าชมรายวัน</h2>
        <p className="mb-4 text-[13px] text-muted-foreground">
          {data.range.label} · เวลาประเทศไทย
        </p>
        <VisitorsChart daily={data.daily} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="border-b border-line p-5">
          <h2 className="text-[15px] font-bold text-ink">หน้าที่เข้าชมมากที่สุด</h2>
        </div>
        {data.topPages.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            ยังไม่มีข้อมูลในช่วงนี้
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left text-[13px] font-semibold text-muted-foreground">
                <th className="p-4 font-semibold">หน้า</th>
                <th className="p-4 text-right font-semibold">ครั้ง</th>
              </tr>
            </thead>
            <tbody>
              {data.topPages.map((p) => (
                <tr key={p.path} className="border-b border-line last:border-0">
                  <td className="max-w-0 truncate p-4 font-medium text-ink">
                    {p.path}
                  </td>
                  <td className="p-4 text-right font-semibold whitespace-nowrap">
                    {nf.format(p.views)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  change,
  compareLabel,
}: {
  label: string;
  value: string;
  unit: string;
  change: number | null;
  compareLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="text-[13px] font-semibold text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[30px] leading-none font-bold text-ink">
          {value}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-2.5">
        <ChangeChip change={change} compareLabel={compareLabel} />
      </div>
    </div>
  );
}

function ChangeChip({
  change,
  compareLabel,
}: {
  change: number | null;
  compareLabel: string;
}) {
  // No baseline to divide by — showing "+100%" against zero would invent growth.
  if (change === null) {
    return (
      <span className="text-[12px] text-muted-foreground">
        ไม่มีข้อมูล {compareLabel}
      </span>
    );
  }

  const Icon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;
  const tone =
    change > 0
      ? "text-emerald-600"
      : change < 0
        ? "text-rose-600"
        : "text-muted-foreground";

  return (
    <span className="inline-flex items-center gap-1 text-[12px]">
      <span className={cn("inline-flex items-center gap-0.5 font-semibold", tone)}>
        <Icon className="size-3.5" />
        {change > 0 ? "+" : ""}
        {change}%
      </span>
      <span className="text-muted-foreground">เทียบ {compareLabel}</span>
    </span>
  );
}
