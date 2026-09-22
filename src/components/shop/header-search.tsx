"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useDict, useLocale } from "@/i18n/locale-provider";
import { pick } from "@/i18n/pick";
import { formatPrice } from "@/lib/utils";

type SearchProduct = {
  id: string;
  slug: string;
  name: string;
  nameRo: string;
  price: number;
  oldPrice: number | null;
  image: string;
};

export function HeaderSearch() {
  const dict = useDict();
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.products ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goToAllResults() {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/catalog?q=${encodeURIComponent(q)}`);
  }

  return (
    <div ref={wrapperRef} className="relative min-w-0 flex-1">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goToAllResults();
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={dict.header.searchPlaceholder}
          className="w-full rounded-full border border-border bg-surface py-2 pl-10 pr-9 text-sm text-foreground outline-none focus:border-primary"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-muted hover:text-foreground"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-lg animate-menu-in">
          {results.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-muted"
            >
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                <Image src={p.image || "/images/placeholder.svg"} alt="" fill sizes="40px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{pick(p.name, p.nameRo, locale)}</span>
              <span className="shrink-0 text-sm font-semibold text-foreground">{formatPrice(p.price)}</span>
            </Link>
          ))}
          {!loading && results.length === 0 ? (
            <p className="p-3 text-center text-sm text-muted">{dict.header.searchNoResults}</p>
          ) : null}
          <button
            type="button"
            onClick={goToAllResults}
            className="mt-1 block w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-primary hover:bg-primary-soft"
          >
            {dict.header.searchShowAll(query.trim())}
          </button>
        </div>
      ) : null}
    </div>
  );
}
