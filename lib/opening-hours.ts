/**
 * Whether the shop is open *right now*, in Bangkok time.
 *
 * Kept free of React and of the shop's own data so it unit tests directly, and
 * so the same answer is computed on the server for first paint and in the
 * browser as the clock ticks.
 */

const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Minutes since local midnight. */
export const hm = (hour: number, minute: number) => hour * 60 + minute;

export interface DayHours {
  open: number;
  close: number;
}

/** Index 0 is Sunday through 6 Saturday; `null` means closed all day. */
export type WeekHours = readonly (DayHours | null)[];

export interface NextOpening {
  weekday: number;
  minutes: number;
  /** 0 = later today, 1 = tomorrow, and so on. */
  daysAhead: number;
}

export interface ShopStatus {
  isOpen: boolean;
  /** Bangkok weekday, 0 = Sunday. */
  weekday: number;
  /** Bangkok minutes since midnight. */
  minutesNow: number;
  today: DayHours | null;
  /** When the shop next opens, or `null` if the week has no opening hours. */
  nextOpening: NextOpening | null;
}

/** Bangkok is a fixed UTC+7 — no DST since 1952 — so a shift is exact. */
function bangkokNow(now: Date) {
  const shifted = new Date(now.getTime() + BKK_OFFSET_MS);
  return {
    weekday: shifted.getUTCDay(),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

function findNextOpening(
  week: WeekHours,
  weekday: number,
  minutes: number
): NextOpening | null {
  for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
    const wd = (weekday + daysAhead) % 7;
    const hours = week[wd];
    if (!hours) continue;
    // Today only counts if the shop has not opened yet.
    if (daysAhead === 0 && minutes >= hours.open) continue;
    return { weekday: wd, minutes: hours.open, daysAhead };
  }
  return null;
}

export function shopStatus(week: WeekHours, now: Date): ShopStatus {
  const { weekday, minutes } = bangkokNow(now);
  const today = week[weekday] ?? null;
  // Closing time is exclusive: at 17:30 the shop has shut.
  const isOpen = !!today && minutes >= today.open && minutes < today.close;

  return {
    isOpen,
    weekday,
    minutesNow: minutes,
    today,
    nextOpening: isOpen ? null : findNextOpening(week, weekday, minutes),
  };
}

/** `510` -> `"08:30"`. */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
