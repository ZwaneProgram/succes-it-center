import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { labelMap, type CategoryDef } from "@/lib/categories";
import { decorate, type DecoratedProduct } from "@/lib/products";

/**
 * Cache tag for all catalogue reads. Admin mutations call
 * `revalidateTag(PRODUCTS_TAG)` so edits show up immediately; the `revalidate`
 * window below is only a safety net if a mutation ever misses invalidation.
 */
export const PRODUCTS_TAG = "products";

/** Separate tag so category edits bust the storefront without touching products. */
export const CATEGORIES_TAG = "categories";

const REVALIDATE_SECONDS = 300;

// Only cache in production. In development we always read fresh from the DB so
// admin edits / seed changes show immediately (unstable_cache otherwise
// persists stale data across requests even in dev).
const useCache = process.env.NODE_ENV === "production";

async function readCategories(): Promise<CategoryDef[]> {
  return prisma.category.findMany({
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    select: {
      id: true,
      slug: true,
      th: true,
      en: true,
      icon: true,
      gradient: true,
      sub: true,
      sort: true,
    },
  });
}

/** Slug -> Thai label, so `decorate()` can render the category badge. */
async function categoryLabels(): Promise<Record<string, string>> {
  return labelMap(await getCategories());
}

async function readAllProducts(): Promise<DecoratedProduct[]> {
  const [rows, labels] = await Promise.all([
    prisma.product.findMany({ orderBy: { id: "asc" } }),
    categoryLabels(),
  ]);
  return rows.map((r) => decorate(r, labels));
}

async function readProduct(id: number): Promise<DecoratedProduct | null> {
  if (!Number.isInteger(id)) return null;
  const [row, labels] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    categoryLabels(),
  ]);
  return row ? decorate(row, labels) : null;
}

async function readBestSellers(n = 4): Promise<DecoratedProduct[]> {
  const [rows, labels] = await Promise.all([
    prisma.product.findMany({ orderBy: { rating: "desc" }, take: n }),
    categoryLabels(),
  ]);
  return rows.map((r) => decorate(r, labels));
}

async function readTypeCounts(): Promise<Record<string, number>> {
  const grouped = await prisma.product.groupBy({
    by: ["type"],
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  let all = 0;
  for (const g of grouped) {
    counts[g.type] = g._count._all;
    all += g._count._all;
  }
  counts.all = all;
  return counts;
}

// Products embed the category label, so product caches carry the category tag
// too — renaming a category refreshes every product view that shows it.
const catOpts = { tags: [CATEGORIES_TAG], revalidate: REVALIDATE_SECONDS };
const productOpts = {
  tags: [PRODUCTS_TAG, CATEGORIES_TAG],
  revalidate: REVALIDATE_SECONDS,
};

export const getCategories = useCache
  ? unstable_cache(readCategories, ["getCategories"], catOpts)
  : readCategories;

export const getAllProducts = useCache
  ? unstable_cache(readAllProducts, ["getAllProducts"], productOpts)
  : readAllProducts;

export const getProduct = useCache
  ? unstable_cache(readProduct, ["getProduct"], productOpts)
  : readProduct;

export const bestSellers = useCache
  ? unstable_cache(readBestSellers, ["bestSellers"], productOpts)
  : readBestSellers;

export const typeCounts = useCache
  ? unstable_cache(readTypeCounts, ["typeCounts"], productOpts)
  : readTypeCounts;
