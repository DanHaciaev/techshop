import Link from "next/link";
import { Package, ClipboardList, Tag, Store as StoreIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/status-badge";
import { getDict } from "@/i18n/get-dictionary";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [productsCount, ordersCount, newOrdersCount, promotionsCount, storesCount, revenueAgg, recentOrders, { dict }] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "NEW" } }),
      prisma.promotion.count(),
      prisma.store.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: true } }),
      getDict(),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">{dict.admin.dashboard.title}</h1>

      <div className="grid items-start grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<ClipboardList size={18} />}
          label={dict.admin.dashboard.totalOrders}
          value={ordersCount}
          sub={dict.admin.dashboard.newOrders(newOrdersCount)}
          href="/admin-panel-secret/orders"
        />
        <StatCard icon={<Package size={18} />} label={dict.admin.dashboard.productsCount} value={productsCount} href="/admin-panel-secret/products" />
        <StatCard icon={<Tag size={18} />} label={dict.admin.dashboard.promotionsCount} value={promotionsCount} href="/admin-panel-secret/promotions" />
        <StatCard icon={<StoreIcon size={18} />} label={dict.admin.dashboard.storesCount} value={storesCount} href="/admin-panel-secret/stores" />
      </div>

      <div className="rounded-card border border-border bg-surface p-5">
        <div className="text-sm text-muted">{dict.admin.dashboard.totalRevenue}</div>
        <div className="mt-1 text-2xl font-bold text-foreground">{formatPrice(revenueAgg._sum.total ?? 0)}</div>
      </div>

      <div className="rounded-card border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{dict.admin.dashboard.recentOrders}</h2>
          <Link href="/admin-panel-secret/orders" className="text-sm text-primary hover:text-primary-hover">
            {dict.admin.dashboard.allOrders}
          </Link>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {recentOrders.map((order) => (
            <Link
              key={order.id}
              href={`/admin-panel-secret/orders/${order.id}`}
              className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-surface-muted"
            >
              <div>
                <div className="font-medium text-foreground">{order.customerName}</div>
                <div className="text-muted">
                  {dict.admin.dashboard.itemsCount(order.items.length)} · {order.customerPhone}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">{formatPrice(order.total)}</div>
                <StatusBadge status={order.status} />
              </div>
            </Link>
          ))}
          {recentOrders.length === 0 ? <p className="py-4 text-muted">{dict.admin.dashboard.noOrders}</p> : null}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-card border border-border bg-surface p-4 transition-colors hover:border-primary">
      <div className="flex items-center gap-2 text-muted">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
      {sub ? <div className="text-xs text-muted">{sub}</div> : null}
    </Link>
  );
}
