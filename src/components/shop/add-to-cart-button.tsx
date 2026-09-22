"use client";

import { ShoppingCart, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@prisma/client";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { useDict, useLocale } from "@/i18n/locale-provider";
import { pick } from "@/i18n/pick";

type CartableProduct = Pick<Product, "id" | "name" | "nameRo" | "price" | "image" | "slug" | "stock">;

export function AddToCartButton({
  product,
  compact = false,
}: {
  product: CartableProduct;
  compact?: boolean;
}) {
  const add = useCartStore((s) => s.add);
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const dict = useDict();
  const locale = useLocale();
  const inCart = items.find((i) => i.productId === product.id);
  const outOfStock = product.stock <= 0;
  const name = pick(product.name, product.nameRo, locale);

  function handleAdd() {
    add({
      productId: product.id,
      name: product.name,
      nameRo: product.nameRo,
      price: product.price,
      image: product.image,
      slug: product.slug,
      stock: product.stock,
    });
    toast.success(dict.product.addedToCartTitle, { description: name });
  }

  if (outOfStock) {
    return (
      <button
        disabled
        className={cn(
          "cursor-not-allowed rounded-full bg-surface-muted text-muted",
          compact ? "h-9 w-9" : "px-5 py-2.5 text-sm font-semibold"
        )}
      >
        {compact ? <ShoppingCart size={16} /> : dict.product.outOfStock}
      </button>
    );
  }

  if (inCart) {
    return (
      <div className={cn("flex items-center gap-1 rounded-full border border-border bg-surface", compact ? "h-9 px-1" : "px-2 py-1")}>
        <button
          aria-label={dict.product.decreaseQty}
          onClick={() => setQuantity(product.id, inCart.quantity - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-surface-muted"
        >
          <Minus size={14} />
        </button>
        <span className="w-5 text-center text-sm font-semibold">{inCart.quantity}</span>
        <button
          aria-label={dict.product.increaseQty}
          onClick={() => setQuantity(product.id, inCart.quantity + 1)}
          disabled={inCart.quantity >= product.stock}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-surface-muted disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary-hover cursor-pointer",
        compact ? "h-9 w-9" : "px-5 py-2.5 text-sm"
      )}
    >
      <ShoppingCart size={compact ? 16 : 18} />
      {compact ? null : dict.product.addToCart}
    </button>
  );
}
