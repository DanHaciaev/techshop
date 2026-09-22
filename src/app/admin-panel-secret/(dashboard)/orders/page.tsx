import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/status-badge";
import { getDict } from "@/i18n/get-dictionary";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const [orders, { locale, dict }] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } }),
    getDict(),
  ]);
  const t = dict.admin.orders;
  const dateLocale = locale === "ro" ? "ro-RO" : "ru-RU";

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className="w-full min-w-180 text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{t.colClient}</th>
              <th className="px-4 py-3 font-medium">{t.colPhone}</th>
              <th className="px-4 py-3 font-medium">{t.colItems}</th>
              <th className="px-4 py-3 font-medium">{t.colSum}</th>
              <th className="px-4 py-3 font-medium">{t.colStatus}</th>
              <th className="px-4 py-3 font-medium">{t.colDate}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id} className="cursor-pointer hover:bg-surface-muted">
                <td className="px-4 py-3">
                  <Link href={`/admin-panel-secret/orders/${order.id}`} className="font-medium text-foreground hover:text-primary">
                    {order.customerName}
                  </Link>
                  <div className="text-xs text-muted">#{order.id.slice(-8).toUpperCase()}</div>
                </td>
                <td className="px-4 py-3 text-muted">{order.customerPhone}</td>
                <td className="px-4 py-3 text-muted">{order.items.length}</td>
                <td className="px-4 py-3 font-medium text-foreground">{formatPrice(order.total)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(order.createdAt).toLocaleString(dateLocale, { dateStyle: "short", timeStyle: "short" })}
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  {t.empty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
