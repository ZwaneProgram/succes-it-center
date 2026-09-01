import { hm, type WeekHours } from "@/lib/opening-hours";

// Single source of truth for shop contact / social details.
// Anything still marked TODO is a placeholder awaiting the real value.
export const CONTACT = {
  phoneDisplay: "053-404769",
  // E.164 so the link dials correctly from a mobile abroad.
  phoneHref: "tel:+6653404769",

  lineId: "@successitcenter",
  // TODO: replace with the real LINE official account link
  lineUrl: "https://line.me/R/ti/p/@successit",

  facebookName: "SUCCESS IT CENTER",
  // TODO: replace with the real Facebook page URL
  facebookUrl: "https://facebook.com/successit",

  addressLines: [
    "ชั้น 2 ตึกคอมพิวเตอร์ซิตี้ (ห้อง B216-B217)",
    "ถนนมณีนพรัตน์ ตำบลศรีภูมิ อำเภอเมือง เชียงใหม่ 50200",
  ],
} as const;

/** Searched rather than pinned by coordinates, so no Maps API key is needed. */
const MAP_QUERY = "ตึกคอมพิวเตอร์ซิตี้ ถนนมณีนพรัตน์ เชียงใหม่";

export const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&hl=th&z=17&output=embed`;
export const MAP_LINK_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;

/** Index 0 is Sunday. Mon–Fri 08:30–17:30, Sat 09:30–17:30, closed Sunday. */
export const OPENING_HOURS: WeekHours = [
  null,
  { open: hm(8, 30), close: hm(17, 30) },
  { open: hm(8, 30), close: hm(17, 30) },
  { open: hm(8, 30), close: hm(17, 30) },
  { open: hm(8, 30), close: hm(17, 30) },
  { open: hm(8, 30), close: hm(17, 30) },
  { open: hm(9, 30), close: hm(17, 30) },
];

export const WEEKDAY_NAMES = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
] as const;

export const WEEKDAY_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;

/**
 * The hours table collapses Mon–Fri into one row, which is how the shop states
 * them and how a customer reads them.
 */
export const HOURS_ROWS = [
  { label: "จันทร์ – ศุกร์", weekdays: [1, 2, 3, 4, 5], hours: OPENING_HOURS[1] },
  { label: "เสาร์", weekdays: [6], hours: OPENING_HOURS[6] },
  { label: "อาทิตย์", weekdays: [0], hours: null },
] as const;
