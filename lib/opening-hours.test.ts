import { describe, expect, it } from "vitest";

import { formatMinutes, hm, shopStatus, type WeekHours } from "./opening-hours";

// The shop's real week: Mon–Fri 08:30–17:30, Sat 09:30–17:30, closed Sunday.
const WEEK: WeekHours = [
  null,
  { open: hm(8, 30), close: hm(17, 30) },
  { open: hm(8, 30), close: hm(17, 30) },
  { open: hm(8, 30), close: hm(17, 30) },
  { open: hm(8, 30), close: hm(17, 30) },
  { open: hm(8, 30), close: hm(17, 30) },
  { open: hm(9, 30), close: hm(17, 30) },
];

/** Bangkok is UTC+7, so a Bangkok wall clock is that time minus 7 hours UTC. */
const bkk = (isoDate: string, hour: number, minute = 0) =>
  new Date(`${isoDate}T${String(hour - 7).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`);

// 2026-09-07 is a Monday, so 2026-09-05 is Saturday and 2026-09-06 Sunday.
describe("shopStatus · weekday", () => {
  it("is closed a minute before opening", () => {
    const s = shopStatus(WEEK, bkk("2026-09-07", 8, 29));
    expect(s.isOpen).toBe(false);
    expect(s.nextOpening).toMatchObject({ daysAhead: 0, minutes: hm(8, 30) });
  });

  it("is open exactly at opening time", () => {
    expect(shopStatus(WEEK, bkk("2026-09-07", 8, 30)).isOpen).toBe(true);
  });

  it("is open a minute before closing", () => {
    expect(shopStatus(WEEK, bkk("2026-09-07", 17, 29)).isOpen).toBe(true);
  });

  it("is closed exactly at closing time", () => {
    // 17:30 is when the shop shuts, not its last open minute.
    expect(shopStatus(WEEK, bkk("2026-09-07", 17, 30)).isOpen).toBe(false);
  });

  it("points at tomorrow once the day is over", () => {
    const s = shopStatus(WEEK, bkk("2026-09-07", 20, 0));
    expect(s.isOpen).toBe(false);
    expect(s.nextOpening).toMatchObject({ daysAhead: 1, weekday: 2 });
  });
});

describe("shopStatus · Saturday opens later", () => {
  it("is closed at 09:00, which would be open on a weekday", () => {
    const s = shopStatus(WEEK, bkk("2026-09-05", 9, 0));
    expect(s.isOpen).toBe(false);
    expect(s.nextOpening).toMatchObject({ daysAhead: 0, minutes: hm(9, 30) });
  });

  it("is open at 10:00", () => {
    expect(shopStatus(WEEK, bkk("2026-09-05", 10, 0)).isOpen).toBe(true);
  });

  it("skips Sunday and points at Monday after closing", () => {
    const s = shopStatus(WEEK, bkk("2026-09-05", 18, 0));
    expect(s.nextOpening).toMatchObject({ daysAhead: 2, weekday: 1 });
  });
});

describe("shopStatus · Sunday", () => {
  it("is closed all day", () => {
    for (const hour of [0, 9, 12, 17, 23]) {
      expect(shopStatus(WEEK, bkk("2026-09-06", hour)).isOpen).toBe(false);
    }
  });

  it("points at Monday morning", () => {
    const s = shopStatus(WEEK, bkk("2026-09-06", 12));
    expect(s.nextOpening).toMatchObject({ daysAhead: 1, weekday: 1, minutes: hm(8, 30) });
  });
});

describe("shopStatus · time zone", () => {
  it("uses Bangkok time, not UTC", () => {
    // 03:00 UTC Monday is 10:00 Monday in Bangkok — open.
    expect(shopStatus(WEEK, new Date("2026-09-07T03:00:00Z")).isOpen).toBe(true);
    // 17:00 UTC Sunday is 00:00 Monday in Bangkok — closed, and it is Monday.
    const s = shopStatus(WEEK, new Date("2026-09-06T17:00:00Z"));
    expect(s.weekday).toBe(1);
    expect(s.isOpen).toBe(false);
  });
});

describe("shopStatus · a week with no hours at all", () => {
  it("reports no next opening instead of looping forever", () => {
    const s = shopStatus(new Array(7).fill(null), bkk("2026-09-07", 10));
    expect(s.isOpen).toBe(false);
    expect(s.nextOpening).toBeNull();
  });
});

describe("formatMinutes", () => {
  it("pads to a wall-clock reading", () => {
    expect(formatMinutes(hm(8, 30))).toBe("08:30");
    expect(formatMinutes(hm(17, 30))).toBe("17:30");
    expect(formatMinutes(0)).toBe("00:00");
  });
});
