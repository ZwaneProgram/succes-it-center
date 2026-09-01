import { ListingView } from "@/components/listing/listing-view";
import { ALL_FILTER, type FilterKey } from "@/lib/categories";
import { getAllProducts, getCategories, typeCounts } from "@/lib/queries";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;

  const [products, counts, categories] = await Promise.all([
    getAllProducts(),
    typeCounts(),
    getCategories(),
  ]);

  // Unknown / deleted category in the URL falls back to "all".
  const valid = categories.some((c) => c.slug === cat);
  const initialFilter: FilterKey = valid && cat ? cat : ALL_FILTER;

  return (
    <ListingView
      initialFilter={initialFilter}
      products={products}
      counts={counts}
      categories={categories}
    />
  );
}
