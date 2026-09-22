import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deletePromotion } from "@/lib/actions/promotions";
import { DeleteButton } from "@/components/admin/delete-button";
import { getDict } from "@/i18n/get-dictionary";
import { pick } from "@/i18n/pick";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const [promotions, { locale, dict }] = await Promise.all([
    prisma.promotion.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { products: true } } } }),
    getDict(),
  ]);
  const t = dict.admin.promotions;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
        <Link
          href="/admin-panel-secret/promotions/new"
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Plus size={16} /> {t.newPromotion}
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {promotions.map((promo) => {
          const title = pick(promo.title, promo.titleRo, locale);
          return (
            <div key={promo.id} className="flex items-center gap-4 rounded-card border border-border bg-surface p-3">
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                <Image src={promo.image || "/images/placeholder.svg"} alt={title} fill sizes="112px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground">{title}</div>
                <div className="text-sm text-muted">{t.itemsAndSlug(promo._count.products, promo.slug)}</div>
              </div>
              {promo.active ? (
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">{t.active}</span>
              ) : (
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted">{t.hidden}</span>
              )}
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin-panel-secret/promotions/${promo.id}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary"
                >
                  <Pencil size={15} />
                </Link>
                <DeleteButton action={deletePromotion.bind(null, promo.id)} confirmText={t.deleteConfirm(title)} />
              </div>
            </div>
          );
        })}
        {promotions.length === 0 ? <p className="text-muted">{t.empty}</p> : null}
      </div>
    </div>
  );
}
