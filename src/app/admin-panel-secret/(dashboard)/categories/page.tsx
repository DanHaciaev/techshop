import Link from "next/link";
import { Pencil, CornerDownRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createCategory, deleteCategory } from "@/lib/actions/categories";
import { DeleteButton } from "@/components/admin/delete-button";
import { getDict } from "@/i18n/get-dictionary";
import { pick } from "@/i18n/pick";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories, { locale, dict }] = await Promise.all([
    prisma.category.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    getDict(),
  ]);
  const t = dict.admin.categories;

  const topLevel = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);
  const rows = topLevel.flatMap((parent) => [parent, ...childrenOf(parent.id)]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>

      <form action={createCategory} className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.name}</label>
          <input
            name="name"
            required
            placeholder={t.namePlaceholder}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.nameRo}</label>
          <input
            name="nameRo"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.parentCategory}</label>
          <select
            name="parentId"
            defaultValue=""
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">{t.noParent}</option>
            {topLevel.map((c) => (
              <option key={c.id} value={c.id}>
                {pick(c.name, c.nameRo, locale)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.order}</label>
          <input
            name="order"
            type="number"
            defaultValue={categories.length + 1}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            {t.add}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className="w-full min-w-120 text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{t.colName}</th>
              <th className="px-4 py-3 font-medium">{t.colProducts}</th>
              <th className="px-4 py-3 font-medium">{t.colOrder}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((c) => {
              const name = pick(c.name, c.nameRo, locale);
              const isChild = !!c.parentId;
              return (
                <tr key={c.id} className="hover:bg-surface-muted">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <span className={isChild ? "flex items-center gap-1.5 pl-5 text-muted" : "flex items-center gap-1.5"}>
                      {isChild ? <CornerDownRight size={14} className="shrink-0" /> : null}
                      {name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{c._count.products}</td>
                  <td className="px-4 py-3 text-muted">{c.order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin-panel-secret/categories/${c.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary"
                      >
                        <Pencil size={15} />
                      </Link>
                      <DeleteButton action={deleteCategory.bind(null, c.id)} confirmText={t.deleteConfirm(name)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
