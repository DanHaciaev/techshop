import { Suspense } from "react";
import { getCategoryTree, getFilterDefinitionsFor, getProducts, getProductSalesMap } from "@/lib/data";
import { dictionaries } from "@/i18n/dictionaries";
import { L } from "@/i18n/l";
import { CategoryCarousel } from "@/components/shop/category-carousel";
import { CatalogHome } from "@/components/shop/catalog-home";

export const revalidate = 60;

export const metadata = { title: dictionaries.ru.catalog.title };

export default async function CatalogPage() {
  const [tree, products, filterDefinitions, salesMap] = await Promise.all([
    getCategoryTree(),
    getProducts(),
    getFilterDefinitionsFor(null),
    getProductSalesMap(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        <L ru={dictionaries.ru.catalog.title} ro={dictionaries.ro.catalog.title} />
      </h1>
      <div className="mb-8">
        <CategoryCarousel categories={tree} />
      </div>
      <Suspense>
        <CatalogHome tree={tree} products={products} filterDefinitions={filterDefinitions} salesMap={salesMap} />
      </Suspense>
    </div>
  );
}
