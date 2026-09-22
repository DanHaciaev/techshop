import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { updateOrderStatus } from "@/lib/actions/orders";
import { ORDER_STATUSES } from "@/components/admin/status-badge";
import { getDict } from "@/i18n/get-dictionary";
import { pick } from "@/i18n/pick";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, { locale, dict }] = await Promise.all([
    prisma.order.findUnique({ where: { id }, include: { items: true } }),
    getDict(),
  ]);
  if (!order) notFound();
  const t = dict.admin.orders;
  const dateLocale = locale === "ro" ? "ro-RO" : "ru-RU";

  const store = order.storeId ? await prisma.store.findUnique({ where: { id: order.storeId } }) : null;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{t.orderNumber(order.id.slice(-8).toUpperCase())}</h1>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <div className="rounded-card border border-border bg-surface p-5">
            <h2 className="mb-3 font-semibold text-foreground">{t.itemsHeading}</h2>
            <div className="flex flex-col divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-foreground">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-foreground">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-bold text-foreground">
              <span>{t.total}</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          {order.comment ? (
            <div className="rounded-card border border-border bg-surface p-5">
              <h2 className="mb-2 font-semibold text-foreground">{t.customerComment}</h2>
              <p className="text-sm text-muted">{order.comment}</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-card border border-border bg-surface p-5">
            <h2 className="mb-3 font-semibold text-foreground">{t.clientHeading}</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <Row label={t.name} value={order.customerName} />
              <Row label={t.phone} value={order.customerPhone} />
              {order.customerEmail ? <Row label={t.email} value={order.customerEmail} /> : null}
              <Row label={t.fulfillment} value={order.deliveryType === "delivery" ? t.deliveryLabel : t.pickupLabel} />
              {order.deliveryType === "delivery" ? (
                <Row label={t.address} value={order.address} />
              ) : (
                <Row
                  label={t.store}
                  value={store ? `${pick(store.name, store.nameRo, locale)}, ${pick(store.address, store.addressRo, locale)}` : "—"}
                />
              )}
              <Row
                label={t.createdAt}
                value={new Date(order.createdAt).toLocaleString(dateLocale, { dateStyle: "medium", timeStyle: "short" })}
              />
            </dl>
          </div>

          <div className="rounded-card border border-border bg-surface p-5">
            <h2 className="mb-3 font-semibold text-foreground">{t.statusHeading}</h2>
            <form action={updateOrderStatus.bind(null, order.id)} className="flex flex-col gap-3">
              <select
                name="status"
                defaultValue={order.status}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {dict.orderStatus[s]}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                {t.updateStatus}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
