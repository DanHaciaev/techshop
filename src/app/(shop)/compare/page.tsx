/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCompareStore } from "@/lib/compare-store";
import { useDict, useLocale } from "@/i18n/locale-provider";
import { pick } from "@/i18n/pick";
import { formatPrice, cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { Checkbox } from "@/components/ui/checkbox";

type Attribute = { name: string; nameRo?: string; value: string; valueRo?: string };
type CompareProduct = {
  id: string;
  slug: string;
  name: string;
  nameRo: string;
  price: number;
  stock: number;
  image: string;
  attributes: string;
  category: { name: string; nameRo: string } | null;
};

function parseAttributes(raw: string): Attribute[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ComparePage() {
  const dict = useDict();
  const locale = useLocale();
  const ids = useCompareStore((s) => s.ids);
  const remove = useCompareStore((s) => s.remove);
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyDiff, setOnlyDiff] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products/by-ids?ids=${ids.join(",")}`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []))
      .finally(() => setLoading(false));
  }, [mounted, ids]);

  const rows = useMemo(() => {
    if (products.length === 0) return [];

    const attrRows = products.map((p) => parseAttributes(p.attributes));
    const attrNames = Array.from(new Set(attrRows.flat().map((a) => a.name)));

    type Row = { label: string; values: string[] };
    const result: Row[] = [
      { label: dict.compare.rowCategory, values: products.map((p) => (p.category ? pick(p.category.name, p.category.nameRo, locale) : "—")) },
      { label: dict.compare.rowPrice, values: products.map((p) => formatPrice(p.price)) },
      { label: dict.compare.rowStock, values: products.map((p) => (p.stock > 0 ? String(p.stock) : "—")) },
    ];

    for (const name of attrNames) {
      const values = products.map((_, i) => {
        const attr = attrRows[i].find((a) => a.name === name);
        if (!attr) return "—";
        return pick(attr.value, attr.valueRo, locale);
      });
      const label = pick(name, attrRows.flat().find((a) => a.name === name)?.nameRo || name, locale);
      result.push({ label, values });
    }

    return result;
  }, [products, locale, dict]);

  const visibleRows = onlyDiff ? rows.filter((r) => new Set(r.values).size > 1) : rows;

  if (!mounted || loading) return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6" />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{dict.compare.pageTitle}</h1>

      {products.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-8 text-center">
          <p className="text-muted">{dict.compare.empty}</p>
          <Link href="/catalog" className="mt-4 inline-block text-primary hover:text-primary-hover">
            {dict.compare.goToCatalog}
          </Link>
        </div>
      ) : (
        <>
          <Checkbox checked={onlyDiff} onChange={setOnlyDiff} label={dict.compare.onlyDifferences} className="mb-4 w-fit" />

          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <table className="w-full min-w-160 border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-40 border-b border-border p-3 text-left text-muted" />
                  {products.map((p) => (
                    <th key={p.id} className="border-b border-border p-3 text-left align-top">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => remove(p.id)}
                          className="flex items-center gap-1 self-end text-xs text-muted hover:text-danger"
                        >
                          <Trash2 size={12} /> {dict.compare.remove2}
                        </button>
                        <Link href={`/product/${p.slug}`} className="relative block aspect-square w-24 overflow-hidden rounded-lg bg-surface-muted">
                          <Image src={p.image || "/images/placeholder.svg"} alt="" fill sizes="96px" className="object-cover" />
                        </Link>
                        <Link href={`/product/${p.slug}`} className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary">
                          {pick(p.name, p.nameRo, locale)}
                        </Link>
                        <AddToCartButton
                          product={{
                            id: p.id,
                            slug: p.slug,
                            name: p.name,
                            nameRo: p.nameRo,
                            price: p.price,
                            image: p.image,
                            stock: p.stock,
                          }}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => {
                  const allSame = new Set(row.values).size === 1;
                  return (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="p-3 font-medium text-muted">{row.label}</td>
                      {row.values.map((v, j) => (
                        <td
                          key={j}
                          className={cn("p-3 text-foreground", !allSame ? "bg-primary-soft font-semibold text-primary" : "")}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
