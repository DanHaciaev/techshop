import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { getDict } from "@/i18n/get-dictionary";

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, { dict }] = await Promise.all([
    prisma.order.findUnique({ where: { id }, include: { items: true } }),
    getDict(),
  ]);

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <CheckCircle2 size={56} className="mx-auto text-success" />
      <h1 className="mt-4 text-2xl font-bold text-foreground">{dict.orderSuccess.title}</h1>
      <p className="mt-2 text-muted">
        {dict.orderSuccess.orderNumber} <span className="font-mono text-foreground">{order.id.slice(-8).toUpperCase()}</span>
      </p>
      <p className="mt-1 text-muted">{dict.orderSuccess.contactNote(order.customerPhone)}</p>

      <div className="mt-8 rounded-card border border-border bg-surface p-5 text-left">
        <h2 className="mb-3 font-semibold text-foreground">{dict.orderSuccess.composition}</h2>
        <div className="flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground">
                {item.name} × {item.quantity}
              </span>
              <span className="text-muted">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-bold text-foreground">
          <span>{dict.cart.total}</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        {dict.orderSuccess.home}
      </Link>
    </div>
  );
}
