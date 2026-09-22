import { getActiveStores } from "@/lib/data";
import { getDict } from "@/i18n/get-dictionary";
import { CheckoutForm } from "@/components/shop/checkout-form";

export async function generateMetadata() {
  const { dict } = await getDict();
  return { title: dict.checkout.title };
}

export default async function CheckoutPage() {
  const [stores, { dict }] = await Promise.all([getActiveStores(), getDict()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{dict.checkout.title}</h1>
      <CheckoutForm stores={stores} />
    </div>
  );
}
