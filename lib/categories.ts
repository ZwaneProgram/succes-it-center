/**
 * Categories are stored in the DB (model `Category`) and managed from
 * /admin/categories. This module holds only the pure, client-safe pieces —
 * the row shape, the icon/gradient registries the admin picker offers, and
 * the helpers that turn a category list into storefront filters/metadata.
 *
 * The cached DB read lives in lib/queries.ts (`getCategories`).
 */

/** Row shape passed from server components to the UI. */
export interface CategoryDef {
  id: number;
  slug: string;
  th: string;
  en: string;
  icon: string;
  gradient: string;
  sub: string | null;
  sort: number;
}

/** Icons the admin can pick from — keys map to lucide icons in category-icon.tsx. */
export const CATEGORY_ICON_KEYS = [
  "dome",
  "sensor",
  "alarm",
  "lock",
  "nvr",
  "wifi",
  "bell",
  "monitor",
  "cable",
  "shield",
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];

export const DEFAULT_ICON: CategoryIconKey = "dome";

/** Gradient swatches offered in the admin picker (first one is the default). */
export const CATEGORY_GRADIENTS = [
  "linear-gradient(135deg,#5EE7D3,#2F6BFF)",
  "linear-gradient(135deg,#2F6BFF,#5EE7D3)",
  "linear-gradient(135deg,#8B5CF6,#2F6BFF)",
  "linear-gradient(135deg,#FDA085,#F6416C)",
  "linear-gradient(135deg,#A8E063,#2F6BFF)",
  "linear-gradient(135deg,#0E1B2A,#2F6BFF)",
] as const;

export const DEFAULT_GRADIENT = CATEGORY_GRADIENTS[0];

/**
 * Build a URL-safe slug. Thai characters are kept (Next handles them fine in
 * query strings) — only whitespace and punctuation are normalised.
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_/]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

/** "all" plus one entry per category — used by the listing sidebar. */
export type FilterKey = string;

export const ALL_FILTER: FilterKey = "all";

export function filtersFrom(cats: CategoryDef[]): { k: FilterKey; l: string }[] {
  return [
    { k: ALL_FILTER, l: "ทั้งหมด" },
    ...cats.map((c) => ({ k: c.slug, l: c.th })),
  ];
}

const ALL_META = {
  title: "สินค้าทั้งหมด",
  sub: "อุปกรณ์รักษาความปลอดภัยครบวงจร คัดสรรคุณภาพสำหรับบ้านและธุรกิจ",
};

/** Hero title/subtitle for the current listing filter. */
export function categoryMeta(
  cats: CategoryDef[],
  key: FilterKey
): { title: string; sub: string } {
  if (key === ALL_FILTER) return ALL_META;
  const cat = cats.find((c) => c.slug === key);
  if (!cat) return ALL_META;
  return {
    title: cat.th,
    sub: cat.sub?.trim() || `${cat.th} คัดสรรคุณภาพ พร้อมบริการติดตั้งและรับประกันศูนย์ไทย`,
  };
}

/** Thai label lookup keyed by slug — fed into `decorate()`. */
export function labelMap(cats: CategoryDef[]): Record<string, string> {
  return Object.fromEntries(cats.map((c) => [c.slug, c.th]));
}
