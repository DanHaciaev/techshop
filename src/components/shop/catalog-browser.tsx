"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ProductWithCategory } from "@/components/shop/product-card";
import { ProductCard } from "@/components/shop/product-card";
import { Checkbox } from "@/components/ui/checkbox";
import { useDict, useLocale } from "@/i18n/locale-provider";
import { pick } from "@/i18n/pick";
import { cn } from "@/lib/utils";

type Sort = "newest" | "priceAsc" | "priceDesc";
type Attribute = { name: string; nameRo?: string; value: string; valueRo?: string };

function parseAttributes(raw: string): Attribute[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">{children}</h3>;
}

type FilterDefinitionLite = { name: string; nameRo: string };

export function CatalogBrowser({
  products,
  filterDefinitions,
}: {
  products: ProductWithCategory[];
  filterDefinitions?: FilterDefinitionLite[];
}) {
  const dict = useDict();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [selectedFacets, setSelectedFacets] = useState<Record<string, Set<string>>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  const withAttrs = useMemo(
    () => products.map((p) => ({ product: p, attributes: parseAttributes(p.attributes) })),
    [products]
  );

  // Build facet groups: attribute name (ru, used as stable key) -> unique values seen.
  const facetGroups = useMemo(() => {
    const map = new Map<string, { labelRu: string; labelRo: string; values: Map<string, { ru: string; ro: string }> }>();
    for (const { attributes } of withAttrs) {
      for (const attr of attributes) {
        if (!attr.name || !attr.value) continue;
        if (!map.has(attr.name)) {
          map.set(attr.name, { labelRu: attr.name, labelRo: attr.nameRo || attr.name, values: new Map() });
        }
        map.get(attr.name)!.values.set(attr.value, { ru: attr.value, ro: attr.valueRo || attr.value });
      }
    }
    const allGroups = Array.from(map.entries()).map(([key, group]) => ({
      key,
      label: pick(group.labelRu, group.labelRo, locale),
      values: Array.from(group.values.values()),
    }));

    // When the admin has configured explicit filter definitions for this
    // scope, they control which facet groups appear and in what order.
    // Otherwise fall back to showing everything derived from the data.
    if (!filterDefinitions || filterDefinitions.length === 0) return allGroups;
    const byKey = new Map(allGroups.map((g) => [g.key, g]));
    return filterDefinitions
      .map((def) => {
        const group = byKey.get(def.name);
        if (!group) return null;
        return { ...group, label: pick(def.name, def.nameRo, locale) };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);
  }, [withAttrs, locale, filterDefinitions]);

  function toggleFacetValue(groupKey: string, value: string) {
    setSelectedFacets((prev) => {
      const next = { ...prev };
      const set = new Set(next[groupKey] ?? []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      if (set.size === 0) delete next[groupKey];
      else next[groupKey] = set;
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;
    const facetEntries = Object.entries(selectedFacets);

    let list = withAttrs.filter(({ product: p, attributes }) => {
      if (q) {
        const name = pick(p.name, p.nameRo, locale).toLowerCase();
        if (!name.includes(q)) return false;
      }
      if (min !== undefined && p.price < min) return false;
      if (max !== undefined && p.price > max) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (onSaleOnly && !(p.oldPrice && p.oldPrice > p.price)) return false;
      for (const [groupKey, values] of facetEntries) {
        const hasMatch = attributes.some((a) => a.name === groupKey && values.has(a.value));
        if (!hasMatch) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "priceAsc") return a.product.price - b.product.price;
      if (sort === "priceDesc") return b.product.price - a.product.price;
      return new Date(b.product.createdAt).getTime() - new Date(a.product.createdAt).getTime();
    });

    return list.map((x) => x.product);
  }, [withAttrs, search, minPrice, maxPrice, sort, inStockOnly, onSaleOnly, selectedFacets, locale]);

  const facetActiveCount = Object.values(selectedFacets).reduce((sum, s) => sum + s.size, 0);
  const hasActiveFilters = !!(search || minPrice || maxPrice || sort !== "newest" || inStockOnly || onSaleOnly || facetActiveCount);

  function reset() {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSelectedFacets({});
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-45">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={dict.filters.search}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:hidden",
            filtersOpen ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-foreground"
          )}
        >
          <SlidersHorizontal size={15} />
          {dict.filters.filtersLabel}
        </button>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="newest">{dict.filters.sortNewest}</option>
          <option value="priceAsc">{dict.filters.sortPriceAsc}</option>
          <option value="priceDesc">{dict.filters.sortPriceDesc}</option>
        </select>

        <span className="text-sm text-muted sm:ml-auto">{dict.filters.foundCount(filtered.length)}</span>
      </div>

      <div className="grid items-start gap-4 sm:grid-cols-[240px_1fr]">
        <aside
          className={cn(
            "flex-col divide-y divide-border overflow-hidden rounded-card border border-border bg-surface",
            filtersOpen ? "flex" : "hidden sm:flex"
          )}
        >
          <div className="p-4">
            <SectionLabel>{dict.filters.price}</SectionLabel>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                inputMode="numeric"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder={dict.filters.priceFrom}
                className="w-full min-w-0 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              />
              <span className="text-muted">—</span>
              <input
                type="number"
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder={dict.filters.priceTo}
                className="w-full min-w-0 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 p-4">
            <Checkbox checked={inStockOnly} onChange={setInStockOnly} label={dict.filters.inStockOnly} />
            <Checkbox checked={onSaleOnly} onChange={setOnSaleOnly} label={dict.filters.onSaleOnly} />
          </div>

          {facetGroups.map((group) => (
            <div key={group.key} className="p-4">
              <SectionLabel>{group.label}</SectionLabel>
              <div className="flex flex-col gap-2">
                {group.values.map((v) => (
                  <Checkbox
                    key={v.ru}
                    checked={selectedFacets[group.key]?.has(v.ru) ?? false}
                    onChange={() => toggleFacetValue(group.key, v.ru)}
                    label={pick(v.ru, v.ro, locale)}
                  />
                ))}
              </div>
            </div>
          ))}

          {hasActiveFilters ? (
            <div className="p-4">
              <button
                type="button"
                onClick={reset}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm font-medium text-muted transition-colors hover:border-danger/40 hover:text-danger"
              >
                <X size={14} />
                {dict.filters.reset}
              </button>
            </div>
          ) : null}
        </aside>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {filtered.length === 0 ? <p className="col-span-full py-8 text-center text-muted">{dict.filters.noMatches}</p> : null}
        </div>
      </div>
    </div>
  );
}
