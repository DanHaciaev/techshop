"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { useDict, useLocale } from "@/i18n/locale-provider";
import { pick } from "@/i18n/pick";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const dict = useDict();
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center">
        <ShoppingBag size={48} className="text-muted" />
        <h1 className="mt-4 text-xl font-bold text-foreground">{dict.cart.empty}</h1>
        <p className="mt-2 text-muted">{dict.cart.emptyHint}</p>
        <Link
          href="/catalog"
          className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {dict.cart.goToCatalog}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{dict.cart.title}</h1>
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 rounded-card border border-border bg-surface p-3"
            >
              <Link href={`/product/${item.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                <Image
                  src={item.image || "/images/placeholder.svg"}
                  alt={pick(item.name, item.nameRo, locale)}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary">
                  {pick(item.name, item.nameRo, locale)}
                </Link>
                <div className="mt-1 text-sm font-semibold text-foreground">{formatPrice(item.price)}</div>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-border">
                <button
                  aria-label={dict.product.decreaseQty}
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-muted"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  aria-label={dict.product.increaseQty}
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-muted disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                aria-label={dict.cart.removeItem}
                onClick={() => remove(item.productId)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-danger"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-card border border-border bg-surface p-5">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>{dict.cart.items(items.reduce((s, i) => s + i.quantity, 0))}</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-lg font-bold text-foreground">
            <span>{dict.cart.total}</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-5 flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            {dict.cart.checkout} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
