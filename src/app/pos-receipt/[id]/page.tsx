import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

// Deliberately outside any authenticated route group and outside proxy.ts's
// matcher: the local print-agent's headless Chrome (see print-agent/printer.js)
// has no session cookie of its own — it loads this URL directly. The order
// id (an unguessable cuid) is the only access control, same trade-off the
// online checkout's own /checkout/success/[id] page already makes.
export const dynamic = "force-dynamic";

const PAYMENT_LABEL: Record<string, string> = { cash: "Наличные", card: "Карта" };

export default async function PosReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({ where: { id }, include: { items: true, store: true } }),
    getSettings(),
  ]);
  if (!order || order.source !== "pos") notFound();

  return (
    <div className="mx-auto w-70 bg-white p-3 font-mono text-xs leading-tight text-black">
      <div className="text-center">
        <div className="text-sm font-bold">{settings.shopName}</div>
        {order.store ? <div>{order.store.name}</div> : null}
        <div>{new Date(order.createdAt).toLocaleString("ru-RU")}</div>
        <div>Чек №{order.id.slice(-8).toUpperCase()}</div>
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      {order.items.map((item) => (
        <div key={item.id} className="pt-1">
          <div>{item.name}</div>
          <div className="flex justify-between">
            <span>
              {item.quantity} x {formatPrice(item.price)}
            </span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </div>
        </div>
      ))}

      <div className="my-2 border-t border-dashed border-black" />

      <div className="flex justify-between font-bold">
        <span>ИТОГО</span>
        <span>{formatPrice(order.total)}</span>
      </div>
      <div className="flex justify-between">
        <span>Оплата</span>
        <span>{PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</span>
      </div>

      <div className="my-2 border-t border-dashed border-black" />
      <div className="text-center">Спасибо за покупку!</div>
    </div>
  );
}
