"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CategoryTreeNode } from "@/lib/data";
import type { ProductWithCategory } from "@/components/shop/product-card";
import { ProductCard } from "@/components/shop/product-card";
import { CatalogBrowser } from "@/components/shop/catalog-browser";
import { L } from "@/i18n/l";
import { useDict } from "@/i18n/locale-provider";

const PREVIEW_COUNT = 4;

export function CatalogHome({
  tree,
  products,
  filterDefinitions,
  salesMap,
}: {
  tree: CategoryTreeNode[];
  products: ProductWithCategory[];
  filterDefinitions?: { name: string; nameRo: string }[];
  salesMap: Record<string, number>;
}) {
  const dict = useDict();
  const searchParams = useSearchParams();
  const hasQuery = (searchParams.get("q") ?? "").trim().length > 0;

  // A product assigned to a subcategory (e.g. "Apple" under "Смартфоны") is
  // grouped under its top-level ancestor here, so every section on this
  // landing page maps 1:1 to a top-level category tile above it.
  const sections = useMemo(() => {
    const topLevelIdOf = new Map<string, string>();
    for (const parent of tree) {
      topLevelIdOf.set(parent.id, parent.id);
      for (const child of parent.children) topLevelIdOf.set(child.id, parent.id);
    }

    return tree
      .map((category) => {
        const items = products.filter((p) => p.categoryId && topLevelIdOf.get(p.categoryId) === category.id);
        // "Popular" is driven entirely by real sales — not a manual admin flag.
        const preview = [...items]
          .sort((a, b) => {
            const diff = (salesMap[b.id] ?? 0) - (salesMap[a.id] ?? 0);
            if (diff !== 0) return diff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
          .slice(0, PREVIEW_COUNT);
        return { category, total: items.length, preview };
      })
      .filter((s) => s.total > 0);
  }, [tree, products, salesMap]);

  if (hasQuery) {
    return <CatalogBrowser products={products} filterDefinitions={filterDefinitions} />;
  }

  return (
    <div className="flex flex-col gap-12">
      {sections.map(({ category, total, preview }) => (
        <section key={category.id}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              <L ru={category.name} ro={category.nameRo} />
            </h2>
            {total > preview.length ? (
              <Link
                href={`/catalog/${category.slug}`}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
              >
                {dict.catalog.viewAllInCategory} <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {preview.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
