import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCategoryTree, getCategoryWithDescendantIds, getFilterDefinitionsFor, getProducts } from "@/lib/data";
import { dictionaries } from "@/i18n/dictionaries";
import { L } from "@/i18n/l";
import { CategoryCarousel } from "@/components/shop/category-carousel";
import { CatalogBrowser } from "@/components/shop/catalog-browser";

export const revalidate = 60;

export async function generateStaticParams() {
  const categories = await prisma.category.findMany({ select: { slug: true } });
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = await prisma.category.findUnique({ where: { slug: category } });
  return { title: cat ? cat.name : dictionaries.ru.catalog.title };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const [resolved, tree] = await Promise.all([getCategoryWithDescendantIds(category), getCategoryTree()]);
  if (!resolved) notFound();
  const { category: current, categoryIds, all } = resolved;

  // The carousel always shows "the current level of navigation": a parent's
  // own subcategories, or — when viewing a subcategory — its siblings under
  // the same parent, or — for a top-level category with no children at all —
  // every top-level category, so there's always somewhere to go from here.
  const children = all.filter((c) => c.parentId === current.id);
  const siblings = current.parentId ? all.filter((c) => c.parentId === current.parentId) : [];
  const carouselItems = children.length > 0 ? children : siblings.length > 0 ? siblings : tree;

  // Filter definitions are scoped to top-level categories: resolve this
  // category (which may itself be a subcategory) up to its top-level ancestor.
  const topLevelId = current.parentId ?? current.id;
  const [products, filterDefinitions] = await Promise.all([
    getProducts({ categoryIds }),
    getFilterDefinitionsFor(topLevelId),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        <L ru={current.name} ro={current.nameRo} />
      </h1>

      <div className="mb-8">
        <CategoryCarousel categories={carouselItems} activeSlug={category} />
      </div>

      {products.length === 0 ? (
        <p className="text-muted">
          <L ru={dictionaries.ru.catalog.noProductsInCategory} ro={dictionaries.ro.catalog.noProductsInCategory} />
        </p>
      ) : (
        <Suspense>
          <CatalogBrowser products={products} filterDefinitions={filterDefinitions} />
        </Suspense>
      )}
    </div>
  );
}
