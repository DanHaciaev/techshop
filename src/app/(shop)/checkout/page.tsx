import { getActiveStores } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { getDict } from "@/i18n/get-dictionary";
import { CheckoutForm } from "@/components/shop/checkout-form";

export async function generateMetadata() {
  const { dict } = await getDict();
  return { title: dict.checkout.title };
}

export default async function CheckoutPage() {
  const [stores, storeStocks, products, { dict }] = await Promise.all([
    getActiveStores(),
    prisma.storeStock.findMany({ where: { store: { active: true } } }),
    prisma.product.findMany({ select: { id: true, stock: true } }),
    getDict(),
  ]);

  // { storeId: { productId: quantity } } — lets the client-side cart (which
  // the server never sees, it's zustand/localStorage-only) check each of
  // its own items against whichever pickup store the customer picks,
  // without a round trip per selection.
  const stockByStore: Record<string, Record<string, number>> = {};
  const trackedProductIds: string[] = [];
  for (const row of storeStocks) {
    (stockByStore[row.storeId] ??= {})[row.productId] = row.quantity;
    trackedProductIds.push(row.productId);
  }

  // Most products in a fresh shop never get a per-store breakdown configured
  // at all (only a few demo items do) — for those, "no row for this store"
  // must NOT be read as "zero everywhere", or every untracked product would
  // wrongly show as out of stock at every pickup point. Only products that
  // have AT LEAST ONE StoreStock row anywhere are treated as per-store
  // tracked; everything else falls back to the product's own overall stock.
  const productStock = Object.fromEntries(products.map((p) => [p.id, p.stock]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{dict.checkout.title}</h1>
      <CheckoutForm
        stores={stores}
        stockByStore={stockByStore}
        trackedProductIds={trackedProductIds}
        productStock={productStock}
      />
    </div>
  );
}
