import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { updateProduct } from "@/app/admin/actions";
import { getCategories, getProduct } from "@/lib/queries";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  const [product, categories] = await Promise.all([
    getProduct(productId),
    getCategories(),
  ]);
  if (!product) notFound();

  const action = updateProduct.bind(null, productId);
  return (
    <div>
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/admin" className="font-semibold text-brand-blue hover:underline">
          สินค้า
        </Link>
        <span className="mx-1.5">/</span>
        <span className="truncate text-ink">แก้ไข · {product.displayName}</span>
      </nav>
      <ProductForm product={product} categories={categories} action={action} />
    </div>
  );
}
