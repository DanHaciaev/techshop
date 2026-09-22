"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { useDict } from "@/i18n/locale-provider";

export function CartButton({ className }: { className?: string }) {
  const totalItems = useCartStore((s) => s.totalItems());
  const [mounted, setMounted] = useState(false);
  const dict = useDict();
  useEffect(() => setMounted(true), []);

  return (
    <Link
      href="/cart"
      aria-label={dict.header.cart}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted",
        className
      )}
    >
      <ShoppingCart size={18} />
      {mounted && totalItems > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
          {totalItems}
        </span>
      ) : null}
    </Link>
  );
}
