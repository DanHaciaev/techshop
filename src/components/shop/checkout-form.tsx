"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Store } from "@prisma/client";
import { useCartStore } from "@/lib/cart-store";
import { formatPrice, cn } from "@/lib/utils";
import { useDict, useLocale } from "@/i18n/locale-provider";
import { pick } from "@/i18n/pick";

export function CheckoutForm({ stores }: { stores: Store[] }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const clear = useCartStore((s) => s.clear);
  const dict = useDict();
  const locale = useLocale();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => items.length === 0 || submitting, [items.length, submitting]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.get("customerName"),
          customerPhone: formData.get("customerPhone"),
          customerEmail: formData.get("customerEmail") ?? "",
          deliveryType,
          address: formData.get("address") ?? "",
          storeId: deliveryType === "pickup" ? storeId : null,
          comment: formData.get("comment") ?? "",
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || dict.checkout.genericError);
        return;
      }
      clear();
      router.push(`/checkout/success/${data.orderId}`);
    } catch {
      setError(dict.checkout.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface p-8 text-center">
        <p className="text-muted">{dict.checkout.emptyCart}</p>
        <Link href="/catalog" className="mt-4 inline-block text-primary hover:text-primary-hover">
          {dict.cart.goToCatalog}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label={dict.checkout.fullName} name="customerName" required placeholder="Иван Иванов" />
        <Field label={dict.checkout.phone} name="customerPhone" required placeholder="+373 6X XXX XXX" type="tel" />
        <Field label={dict.checkout.email} name="customerEmail" type="email" placeholder="you@example.com" />

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">{dict.checkout.deliveryMethod}</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeliveryType("delivery")}
              className={cn(
                "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                deliveryType === "delivery"
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface text-foreground hover:bg-surface-muted"
              )}
            >
              {dict.checkout.delivery}
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType("pickup")}
              className={cn(
                "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                deliveryType === "pickup"
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface text-foreground hover:bg-surface-muted"
              )}
            >
              {dict.checkout.pickup}
            </button>
          </div>
        </div>

        {deliveryType === "delivery" ? (
          <Field label={dict.checkout.address} name="address" required placeholder="Город, улица, дом, квартира" />
        ) : (
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">{dict.checkout.pickupStore}</label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {pick(s.name, s.nameRo, locale)} — {pick(s.address, s.addressRo, locale)}, {pick(s.city, s.cityRo, locale)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">{dict.checkout.comment}</label>
          <textarea
            name="comment"
            rows={3}
            placeholder={dict.checkout.commentPlaceholder}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={disabled}
          className="mt-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? dict.checkout.submitting : dict.checkout.submit}
        </button>
      </form>

      <div className="h-fit rounded-card border border-border bg-surface p-5">
        <h2 className="mb-4 font-semibold text-foreground">{dict.checkout.orderSummary}</h2>
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                <Image
                  src={item.image || "/images/placeholder.svg"}
                  alt={pick(item.name, item.nameRo, locale)}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <div className="line-clamp-1 text-foreground">{pick(item.name, item.nameRo, locale)}</div>
                <div className="text-muted">
                  {item.quantity} × {formatPrice(item.price)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-bold text-foreground">
          <span>{dict.cart.total}</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
      />
    </div>
  );
}
