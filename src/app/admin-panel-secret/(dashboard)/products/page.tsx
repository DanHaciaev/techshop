import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { deleteProduct } from "@/lib/actions/products";
import { DeleteButton } from "@/components/admin/delete-button";
import { getDict } from "@/i18n/get-dictionary";
import { pick } from "@/i18n/pick";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, { locale, dict }] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } }),
    getDict(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{dict.admin.products.title}</h1>
        <Link
          href="/admin-panel-secret/products/new"
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Plus size={16} /> {dict.admin.products.addProduct}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className="w-full min-w-180 text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{dict.admin.products.colProduct}</th>
              <th className="px-4 py-3 font-medium">{dict.admin.products.colCategory}</th>
              <th className="px-4 py-3 font-medium">{dict.admin.products.colPrice}</th>
              <th className="px-4 py-3 font-medium">{dict.admin.products.colStock}</th>
              <th className="px-4 py-3 font-medium">{dict.admin.products.colStatus}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => {
              const name = pick(p.name, p.nameRo, locale);
              return (
                <tr key={p.id} className="hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                        <Image src={p.image || "/images/placeholder.svg"} alt={name} fill sizes="44px" className="object-cover" />
                      </div>
                      <span className="line-clamp-2 max-w-60 font-medium text-foreground">{name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category ? pick(p.category.name, p.category.nameRo, locale) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{formatPrice(p.price)}</div>
                    {p.oldPrice ? <div className="text-xs text-muted line-through">{formatPrice(p.oldPrice)}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{p.stock}</td>
                  <td className="px-4 py-3">
                    {p.active ? (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">{dict.admin.products.active}</span>
                    ) : (
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted">{dict.admin.products.hidden}</span>
                    )}
                    {p.featured ? (
                      <span className="ml-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">{dict.admin.products.featured}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin-panel-secret/products/${p.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary"
                      >
                        <Pencil size={15} />
                      </Link>
                      <DeleteButton action={deleteProduct.bind(null, p.id)} confirmText={dict.admin.products.deleteConfirm(name)} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  {dict.admin.products.empty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
