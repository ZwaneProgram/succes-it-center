import { CategoryManager } from "@/components/admin/category-manager";
import { getCategories, typeCounts } from "@/lib/queries";

export default async function AdminCategoriesPage() {
  const [categories, counts] = await Promise.all([
    getCategories(),
    typeCounts(),
  ]);

  return <CategoryManager categories={categories} counts={counts} />;
}
