import Link from "next/link";

import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/app/admin/actions";
import { getCategories } from "@/lib/queries";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div>
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/admin" className="font-semibold text-brand-blue hover:underline">
          สินค้า
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">เพิ่มสินค้า</span>
      </nav>
      <ProductForm categories={categories} action={createProduct} />
    </div>
  );
}
