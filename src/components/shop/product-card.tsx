import Link from "next/link";
import Image from "next/image";
import type { Product, Category } from "@prisma/client";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { CompareButton } from "@/components/shop/compare-button";
import { L } from "@/i18n/l";
import { dictionaries } from "@/i18n/dictionaries";

export type ProductWithCategory = Product & { category: Category | null };

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(100 - (product.price / product.oldPrice) * 100)
      : null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-shadow hover:shadow-lg hover:shadow-primary/5">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-surface-muted">
        <Image
          src={product.image || "/images/placeholder.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {discount ? (
          <span className="absolute left-2 top-2 rounded-full bg-danger px-2 py-1 text-xs font-bold text-white">
            -{discount}%
          </span>
        ) : null}
        {product.stock <= 0 ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white">
            <L ru={dictionaries.ru.product.outOfStock} ro={dictionaries.ro.product.outOfStock} />
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {product.category ? (
          <span className="text-xs text-muted">
            <L ru={product.category.name} ro={product.category.nameRo} />
          </span>
        ) : null}
        <div className="flex items-start justify-between gap-1">
          <Link href={`/product/${product.slug}`} className="line-clamp-2 min-h-10 text-sm font-medium text-foreground hover:text-primary">
            <L ru={product.name} ro={product.nameRo} />
          </Link>
          <CompareButton productId={product.id} className="h-7 w-7 shrink-0" />
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <div className="text-base font-bold text-foreground">{formatPrice(product.price)}</div>
            {product.oldPrice ? (
              <div className="text-xs text-muted line-through">{formatPrice(product.oldPrice)}</div>
            ) : null}
          </div>
          <AddToCartButton product={product} compact />
        </div>
      </div>
    </div>
  );
}
