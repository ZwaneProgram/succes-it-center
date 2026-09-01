"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORIES_TAG, PRODUCTS_TAG } from "@/lib/queries";
import {
  CATEGORY_GRADIENTS,
  CATEGORY_ICON_KEYS,
  DEFAULT_GRADIENT,
  DEFAULT_ICON,
  slugify,
} from "@/lib/categories";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("ไม่ได้รับอนุญาต");
  }
}

function revalidateEverywhere() {
  // Categories appear on the home grid, the listing filters and every product
  // badge, so bust both catalogue tags and the pages that render them.
  revalidateTag(CATEGORIES_TAG, { expire: 0 });
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
}

type ParsedCategory = {
  slug: string;
  th: string;
  en: string;
  icon: string;
  gradient: string;
  sub: string | null;
};

function parseCategoryForm(
  formData: FormData
): ParsedCategory | { error: string } {
  const th = String(formData.get("th") ?? "").trim();
  const en = String(formData.get("en") ?? "").trim();
  const sub = String(formData.get("sub") ?? "").trim() || null;

  const iconRaw = String(formData.get("icon") ?? "");
  const icon = (CATEGORY_ICON_KEYS as readonly string[]).includes(iconRaw)
    ? iconRaw
    : DEFAULT_ICON;

  const gradientRaw = String(formData.get("gradient") ?? "");
  const gradient = (CATEGORY_GRADIENTS as readonly string[]).includes(gradientRaw)
    ? gradientRaw
    : DEFAULT_GRADIENT;

  // Slug is optional in the form: derive it from the English name (falling back
  // to the Thai one) so the admin never has to think about URLs.
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugRaw || en || th);

  if (!th) return { error: "กรุณากรอกชื่อหมวดหมู่ภาษาไทย" };
  if (!en) return { error: "กรุณากรอกชื่อหมวดหมู่ภาษาอังกฤษ" };
  if (!slug) return { error: "ไม่สามารถสร้างรหัสหมวดหมู่ (slug) ได้ กรุณากรอกเอง" };
  if (slug === "all") return { error: '"all" เป็นรหัสสงวน กรุณาใช้รหัสอื่น' };
  if (slug.length > 40) return { error: "รหัสหมวดหมู่ (slug) ยาวเกินไป" };

  return { slug, th, en, icon, gradient, sub };
}

function isUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

export async function createCategory(
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = parseCategoryForm(formData);
  if ("error" in parsed) return parsed;

  const last = await prisma.category.findFirst({ orderBy: { sort: "desc" } });

  try {
    await prisma.category.create({
      data: { ...parsed, sort: (last?.sort ?? -1) + 1 },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: "มีหมวดหมู่รหัสนี้อยู่แล้ว" };
    throw e;
  }

  revalidateEverywhere();
  return {};
}

export async function updateCategory(
  id: number,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = parseCategoryForm(formData);
  if ("error" in parsed) return parsed;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return { error: "ไม่พบหมวดหมู่" };

  try {
    // Product.type stores the slug, so a rename has to move the products with
    // it — one transaction keeps the catalogue consistent either way.
    await prisma.$transaction(async (tx) => {
      await tx.category.update({ where: { id }, data: parsed });
      if (parsed.slug !== existing.slug) {
        await tx.product.updateMany({
          where: { type: existing.slug },
          data: { type: parsed.slug },
        });
      }
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: "มีหมวดหมู่รหัสนี้อยู่แล้ว" };
    throw e;
  }

  revalidateEverywhere();
  return {};
}

export async function deleteCategory(id: number): Promise<{ error?: string }> {
  await requireAdmin();
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return { error: "ไม่พบหมวดหมู่" };

  // Refuse to orphan products — the admin has to move them first.
  const used = await prisma.product.count({ where: { type: existing.slug } });
  if (used > 0) {
    return {
      error: `ลบไม่ได้ — ยังมีสินค้า ${used} รายการในหมวดนี้ กรุณาย้ายสินค้าไปหมวดอื่นก่อน`,
    };
  }

  await prisma.category.delete({ where: { id } });
  revalidateEverywhere();
  return {};
}

/** Swap a category with its neighbour to reorder the storefront grid. */
export async function moveCategory(
  id: number,
  dir: "up" | "down"
): Promise<{ error?: string }> {
  await requireAdmin();

  const all = await prisma.category.findMany({
    orderBy: [{ sort: "asc" }, { id: "asc" }],
  });
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return { error: "ไม่พบหมวดหมู่" };

  const target = dir === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= all.length) return {};

  // Rewrite the whole list: `sort` values can be duplicated or sparse from
  // older data, so normalising is safer than swapping two numbers.
  const reordered = [...all];
  [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];

  await prisma.$transaction(
    reordered.map((c, i) =>
      prisma.category.update({ where: { id: c.id }, data: { sort: i } })
    )
  );

  revalidateEverywhere();
  return {};
}
