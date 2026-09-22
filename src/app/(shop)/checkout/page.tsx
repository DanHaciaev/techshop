import { getActiveStores } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { getDict } from "@/i18n/get-dictionary";
import { CheckoutForm } from "@/components/shop/checkout-form";

export async function generateMetadata() {
  const { dict } = await getDict();
  return { title: dict.checkout.title };
}

export default async function CheckoutPage() {
  const [stores, storeStocks, { dict }] = await Promise.all([
    getActiveStores(),
    prisma.storeStock.findMany({ where: { store: { active: true } } }),
    getDict(),
  ]);

  // { storeId: { productId: quantity } } — lets the client-side cart (which
  // the server never sees, it's zustand/localStorage-only) check each of
  // its own items against whichever pickup store the customer picks,
  // without a round trip per selection.
  const stockByStore: Record<string, Record<string, number>> = {};
  for (const row of storeStocks) {
    (stockByStore[row.storeId] ??= {})[row.productId] = row.quantity;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{dict.checkout.title}</h1>
      <CheckoutForm stores={stores} stockByStore={stockByStore} />
    </div>
  );
}
