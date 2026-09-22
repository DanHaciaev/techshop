"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Refrigerator,
  Gamepad2,
  Cable,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Category } from "@prisma/client";
import { L } from "@/i18n/l";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  smartphones: Smartphone,
  laptops: Laptop,
  tv: Tv,
  audio: Headphones,
  appliances: Refrigerator,
  gaming: Gamepad2,
  accessories: Cable,
};

export function CategoryCarousel({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(amount: number) {
    scrollerRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  if (categories.length === 0) return null;

  return (
    <div className="relative">
      <div ref={scrollerRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
        {categories.map((c) => {
          const Icon = ICONS[c.slug] ?? Package;
          const isActive = c.slug === activeSlug;
          return (
            <Link
              key={c.id}
              href={`/catalog/${c.slug}`}
              className={cn(
                "group flex w-28 shrink-0 snap-start flex-col items-center gap-2 rounded-card border p-4 text-center transition-colors sm:w-32",
                isActive
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-surface hover:border-primary hover:bg-primary-soft"
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                )}
              >
                <Icon size={22} />
              </span>
              <span className={cn("text-xs font-medium sm:text-sm", isActive ? "text-primary" : "text-foreground")}>
                <L ru={c.name} ro={c.nameRo} />
              </span>
            </Link>
          );
        })}
      </div>

      {categories.length > 6 ? (
        <>
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy(-260)}
            className="absolute -left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface p-1.5 shadow-sm hover:bg-surface-muted sm:flex"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy(260)}
            className="absolute -right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface p-1.5 shadow-sm hover:bg-surface-muted sm:flex"
          >
            <ChevronRight size={16} />
          </button>
        </>
      ) : null}
    </div>
  );
}
