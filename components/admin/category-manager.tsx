"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  FolderPlus,
  Pencil,
  Save,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { CategoryIcon } from "@/components/category-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createCategory,
  deleteCategory,
  moveCategory,
  updateCategory,
} from "@/app/admin/categories/actions";
import {
  CATEGORY_GRADIENTS,
  CATEGORY_ICON_KEYS,
  DEFAULT_GRADIENT,
  DEFAULT_ICON,
  slugify,
  type CategoryDef,
} from "@/lib/categories";
import { cn } from "@/lib/utils";

const fieldCls =
  "h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-brand-teal focus:ring-[3px] focus:ring-brand-teal/20";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink">
        {label}
        {hint && (
          <span className="ml-1.5 font-normal text-muted-foreground">{hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}

/** Add/edit form — rendered inline above the list (new) or in place (edit). */
function CategoryEditor({
  category,
  onCancel,
  onDone,
}: {
  category?: CategoryDef;
  onCancel: () => void;
  onDone: (msg: string) => void;
}) {
  const [pending, setPending] = React.useState(false);
  const [icon, setIcon] = React.useState<string>(category?.icon ?? DEFAULT_ICON);
  const [gradient, setGradient] = React.useState<string>(
    category?.gradient ?? DEFAULT_GRADIENT
  );
  const [en, setEn] = React.useState(category?.en ?? "");
  const [slug, setSlug] = React.useState(category?.slug ?? "");
  // Only auto-fill the slug for brand-new categories; editing an existing slug
  // rewrites every product in it, so we never change it behind the admin's back.
  const autoSlug = !category && !slug;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = category
      ? await updateCategory(category.id, fd)
      : await createCategory(fd);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    onDone(category ? "บันทึกหมวดหมู่แล้ว" : "เพิ่มหมวดหมู่แล้ว");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-brand-teal/50 bg-white p-5 shadow-[0_10px_30px_rgba(14,27,42,.08)]"
    >
      <div className="flex items-center gap-3">
        <CategoryIcon icon={icon} gradient={gradient} size={40} />
        <span className="text-base font-bold text-ink">
          {category ? "แก้ไขหมวดหมู่" : "หมวดหมู่ใหม่"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="ชื่อหมวดหมู่" hint="ภาษาไทย">
          <input
            name="th"
            defaultValue={category?.th}
            placeholder="เช่น กล้องวงจรปิด"
            className={fieldCls}
          />
        </Field>
        <Field label="ชื่อหมวดหมู่" hint="ภาษาอังกฤษ">
          <input
            name="en"
            value={en}
            onChange={(e) => setEn(e.target.value)}
            placeholder="e.g. CCTV Cameras"
            className={fieldCls}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field
            label="รหัสหมวดหมู่ (slug)"
            hint={
              category
                ? "ใช้ใน URL · เปลี่ยนแล้วสินค้าในหมวดจะย้ายตามอัตโนมัติ"
                : "ใช้ใน URL · เว้นว่างเพื่อสร้างจากชื่ออังกฤษ"
            }
          >
            <input
              name="slug"
              value={autoSlug ? slugify(en) : slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="cctv"
              className={cn(fieldCls, "font-mono text-[13px]")}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="คำโปรยหมวดหมู่" hint="แสดงบนหน้ารายการสินค้า · ไม่บังคับ">
            <input
              name="sub"
              defaultValue={category?.sub ?? ""}
              placeholder="เช่น กล้อง CCTV ความละเอียดสูง มองเห็นกลางคืน"
              className={fieldCls}
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-ink">ไอคอน</span>
        <input type="hidden" name="icon" value={icon} />
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ICON_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setIcon(k)}
              aria-label={`ไอคอน ${k}`}
              aria-pressed={icon === k}
              className={cn(
                "rounded-xl border p-1 transition-all",
                icon === k
                  ? "border-brand-teal ring-2 ring-brand-teal/30"
                  : "border-line hover:border-brand-teal/50"
              )}
            >
              <CategoryIcon icon={k} gradient={gradient} size={36} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-ink">สี</span>
        <input type="hidden" name="gradient" value={gradient} />
        <div className="flex flex-wrap gap-2">
          {CATEGORY_GRADIENTS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGradient(g)}
              aria-label="เลือกสีหมวดหมู่"
              aria-pressed={gradient === g}
              className={cn(
                "relative size-10 rounded-xl border transition-all",
                gradient === g
                  ? "border-brand-teal ring-2 ring-brand-teal/30"
                  : "border-line hover:border-brand-teal/50"
              )}
              style={{ background: g }}
            >
              {gradient === g && (
                <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 border-t border-line pt-4">
        <Button type="button" variant="soft" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={pending}>
          <Save className="size-4" />
          {pending ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
      </div>
    </form>
  );
}

function CategoryRow({
  category,
  count,
  isFirst,
  isLast,
  busy,
  onEdit,
  onMove,
  onDelete,
}: {
  category: CategoryDef;
  count: number;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  onEdit: () => void;
  onMove: (dir: "up" | "down") => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3.5 border-b border-line p-4 transition-colors last:border-0 hover:bg-surface/60">
      <CategoryIcon icon={category.icon} gradient={category.gradient} size={44} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-ink">{category.th}</span>
          <Badge variant="outline">{count} สินค้า</Badge>
        </div>
        <div className="truncate font-mono text-xs text-muted-foreground">
          {category.en} · /products?cat={category.slug}
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={busy || isFirst}
          onClick={() => onMove("up")}
          aria-label={`เลื่อน ${category.th} ขึ้น`}
          className="size-9 text-muted-foreground"
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={busy || isLast}
          onClick={() => onMove("down")}
          aria-label={`เลื่อน ${category.th} ลง`}
          className="size-9 text-muted-foreground"
        >
          <ArrowDown className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-brand-blue hover:text-brand-blue"
        >
          <Pencil className="size-3.5" />
          แก้ไข
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={busy}
          onClick={onDelete}
          aria-label={`ลบ ${category.th}`}
          className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function CategoryManager({
  categories,
  counts,
}: {
  categories: CategoryDef[];
  counts: Record<string, number>;
}) {
  const [creating, setCreating] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [busy, setBusy] = React.useState(false);

  function done(msg: string) {
    setCreating(false);
    setEditingId(null);
    toast.success(msg);
  }

  async function onMove(id: number, dir: "up" | "down") {
    setBusy(true);
    const result = await moveCategory(id, dir);
    setBusy(false);
    if (result?.error) toast.error(result.error);
  }

  async function onDelete(cat: CategoryDef) {
    if (!confirm(`ลบหมวดหมู่ "${cat.th}" ?`)) return;
    setBusy(true);
    const result = await deleteCategory(cat.id);
    setBusy(false);
    if (result?.error) toast.error(result.error);
    else toast.success("ลบหมวดหมู่แล้ว");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-ink">หมวดหมู่สินค้า</h2>
          <Badge variant="outline">{categories.length} หมวด</Badge>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}>
            <FolderPlus className="size-4" />
            เพิ่มหมวดหมู่
          </Button>
        )}
      </div>

      <p className="text-[13px] leading-relaxed text-muted-foreground">
        หมวดหมู่ที่เพิ่มที่นี่จะไปแสดงบนหน้าแรก ตัวกรองหน้าสินค้า และตัวเลือก
        “ประเภท” ในฟอร์มสินค้าโดยอัตโนมัติ · ลำดับด้านล่างคือลำดับที่แสดงบนหน้าร้าน
      </p>

      {creating && (
        <CategoryEditor onCancel={() => setCreating(false)} onDone={done} />
      )}

      {categories.length === 0 && !creating ? (
        <EmptyState onAdd={() => setCreating(true)} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          {categories.map((cat, i) =>
            editingId === cat.id ? (
              <div key={cat.id} className="p-3">
                <CategoryEditor
                  category={cat}
                  onCancel={() => setEditingId(null)}
                  onDone={done}
                />
              </div>
            ) : (
              <CategoryRow
                key={cat.id}
                category={cat}
                count={counts[cat.slug] ?? 0}
                isFirst={i === 0}
                isLast={i === categories.length - 1}
                busy={busy}
                onEdit={() => {
                  setCreating(false);
                  setEditingId(cat.id);
                }}
                onMove={(dir) => onMove(cat.id, dir)}
                onDelete={() => onDelete(cat)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-line-soft text-brand-blue">
        <Tags className="size-7" />
      </div>
      <h3 className="mt-4 font-bold text-ink">ยังไม่มีหมวดหมู่</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        สร้างหมวดหมู่แรกเพื่อจัดกลุ่มสินค้าและให้ลูกค้าเลือกดูได้ง่ายขึ้น
      </p>
      <Button className="mt-5" onClick={onAdd}>
        <FolderPlus className="size-4" />
        เพิ่มหมวดหมู่แรก
      </Button>
    </div>
  );
}
