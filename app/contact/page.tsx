import type { Metadata } from "next";
import { ArrowUpRight, MapPin, MessageCircle, Phone } from "lucide-react";

import { ShopStatusPanel } from "@/components/contact/shop-status-panel";
import { CONTACT, MAP_EMBED_URL, MAP_LINK_URL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "ติดต่อเรา · SUCCESS IT CENTER",
  description:
    "โทร 053-404769 หรือทักทาง LINE และ Facebook · ชั้น 2 ตึกคอมพิวเตอร์ซิตี้ ถนนมณีนพรัตน์ เชียงใหม่ · เปิด จันทร์–ศุกร์ 08:30–17:30",
};

// The open/closed readout must reflect the moment the page is opened.
export const dynamic = "force-dynamic";

export default function ContactPage() {
  // Reading the clock is impure by React's rules, but this is a Server
  // Component rendered once per request (see `dynamic` above), and seeding the
  // panel from the server is exactly what makes the first paint correct and
  // hydration stable — computing it in the client instead would mismatch.
  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <div className="animate-sv-fade bg-surface">
      <div className="mx-auto max-w-[1040px] px-5 py-10 sm:py-14">
        <header className="mb-7 max-w-[560px]">
          <span className="text-[11px] font-bold tracking-[.16em] text-brand-blue uppercase">
            ติดต่อเรา
          </span>
          <h1 className="mt-2 text-[clamp(30px,6vw,42px)] leading-[1.1] font-bold tracking-tight text-ink">
            คุยกับเราได้เลย
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            สอบถามสินค้า ขอใบเสนอราคา หรือนัดช่างเข้าไปดูหน้างาน
            ทักมาช่องทางไหนก็ได้ที่สะดวก
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          {/* Channels */}
          <div className="flex flex-col gap-4">
            {/* The phone is the shop's primary channel, so it gets the weight. */}
            <a
              href={CONTACT.phoneHref}
              className="group block rounded-[22px] border border-line bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-brand-blue/40 hover:shadow-[0_18px_36px_rgba(47,107,255,.14)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-accent text-brand-blue">
                  <Phone className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-muted-foreground">
                    โทรหาร้าน
                  </div>
                  <div className="mt-0.5 font-mono text-[28px] leading-tight font-bold tracking-tight text-ink tabular-nums sm:text-[32px]">
                    {CONTACT.phoneDisplay}
                  </div>
                </div>
                <ArrowUpRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-blue" />
              </div>
            </a>

            <div className="grid gap-4 sm:grid-cols-2">
              <ChannelCard
                href={CONTACT.lineUrl}
                label="LINE Official"
                value={CONTACT.lineId}
                action="เพิ่มเพื่อน"
                tint="bg-success-line"
                icon={<MessageCircle className="size-5" />}
              />
              <ChannelCard
                href={CONTACT.facebookUrl}
                label="Facebook"
                value={CONTACT.facebookName}
                action="เปิดเพจ"
                tint="bg-facebook"
                icon={<FacebookMark />}
              />
            </div>
          </div>

          {/* Side column — the live status board. */}
          <div className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2">
            <ShopStatusPanel initialNow={initialNow} />
          </div>

          {/* Map sits under the channels on desktop, and after the hours on
              mobile — you check whether they're open before you set off. */}
          <section className="overflow-hidden rounded-[22px] border border-line bg-card lg:col-start-1">
            <div className="flex flex-wrap items-start justify-between gap-3 p-6 pb-4">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-accent text-brand-blue">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <h2 className="text-[15px] font-bold text-ink">แผนที่ร้าน</h2>
                  <address className="mt-1 text-[13px] leading-relaxed text-muted-foreground not-italic">
                    {CONTACT.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </div>
              </div>
              <a
                href={MAP_LINK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:border-brand-blue/40 hover:bg-accent hover:text-brand-blue focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                นำทาง
                <ArrowUpRight className="size-4" />
              </a>
            </div>
            <iframe
              src={MAP_EMBED_URL}
              title="แผนที่ร้าน SUCCESS IT CENTER"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-[320px] w-full border-0 border-t border-line sm:h-[380px]"
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function ChannelCard({
  href,
  label,
  value,
  action,
  tint,
  icon,
}: {
  href: string;
  label: string;
  value: string;
  action: string;
  tint: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-[22px] border border-line bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(14,27,42,.12)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span
        className={`flex size-11 items-center justify-center rounded-[13px] text-white ${tint}`}
      >
        {icon}
      </span>
      <div className="mt-3.5 text-[13px] font-semibold text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[16px] font-bold text-ink">
        {value}
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-blue">
        {action}
        <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </a>
  );
}

/** lucide dropped brand glyphs, so the Facebook mark is inlined. */
function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.45 1.55-1.45h1.65V3.68c-.29-.04-1.27-.12-2.42-.12-2.4 0-4.03 1.46-4.03 4.15V9.9H7.5V13h2.75v8h3.25Z" />
    </svg>
  );
}
