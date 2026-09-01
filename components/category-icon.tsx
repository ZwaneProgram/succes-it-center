import {
  Bell,
  Cable,
  Cctv,
  Fingerprint,
  HardDrive,
  Monitor,
  RadioTower,
  ShieldCheck,
  Siren,
  Wifi,
} from "lucide-react";

import { DEFAULT_ICON } from "@/lib/categories";
import { cn } from "@/lib/utils";

/** Keys here must stay in sync with CATEGORY_ICON_KEYS in lib/categories.ts. */
const ICONS = {
  dome: Cctv,
  sensor: RadioTower,
  alarm: Siren,
  lock: Fingerprint,
  nvr: HardDrive,
  wifi: Wifi,
  bell: Bell,
  monitor: Monitor,
  cable: Cable,
  shield: ShieldCheck,
} as const;

export function CategoryIcon({
  icon,
  gradient,
  className,
  size = 44,
}: {
  icon: string;
  gradient: string;
  className?: string;
  size?: number;
}) {
  // Icons come from the DB, so an unknown key falls back instead of crashing.
  const Icon = ICONS[icon as keyof typeof ICONS] ?? ICONS[DEFAULT_ICON];
  return (
    <span
      className={cn("flex items-center justify-center rounded-xl", className)}
      style={{ background: gradient, width: size, height: size }}
    >
      <Icon className="size-1/2 text-white" strokeWidth={2.4} />
    </span>
  );
}
