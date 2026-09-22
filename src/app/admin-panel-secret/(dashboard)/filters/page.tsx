import Link from "next/link";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createFilterDefinition, deleteFilterDefinition } from "@/lib/actions/filters";
import { DeleteButton } from "@/components/admin/delete-button";
import { getDict } from "@/i18n/get-dictionary";
import { pick } from "@/i18n/pick";

export const dynamic = "force-dynamic";

export default async function AdminFiltersPage() {
  const [definitions, categories, { locale, dict }] = await Promise.all([
    prisma.filterDefinition.findMany({ include: { category: true }, orderBy: { order: "asc" } }),
    prisma.category.findMany({ where: { parentId: null }, orderBy: { order: "asc" } }),
    getDict(),
  ]);
  const t = dict.admin.filters;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t.hint}</p>
      </div>

      <form action={createFilterDefinition} className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
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
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.scope}</label>
          <select
            name="categoryId"
            defaultValue=""
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">{t.scopeGlobal}</option>
            {categories.map((c) => (
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
            defaultValue={definitions.length + 1}
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

      {definitions.length === 0 ? (
        <p className="text-sm text-muted">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full min-w-120 text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t.colName}</th>
                <th className="px-4 py-3 font-medium">{t.colScope}</th>
                <th className="px-4 py-3 font-medium">{t.colOrder}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {definitions.map((f) => {
                const name = pick(f.name, f.nameRo, locale);
                const scope = f.category ? pick(f.category.name, f.category.nameRo, locale) : t.scopeGlobal;
                return (
                  <tr key={f.id} className="hover:bg-surface-muted">
                    <td className="px-4 py-3 font-medium text-foreground">{name}</td>
                    <td className="px-4 py-3 text-muted">{scope}</td>
                    <td className="px-4 py-3 text-muted">{f.order}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin-panel-secret/filters/${f.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary"
                        >
                          <Pencil size={15} />
                        </Link>
                        <DeleteButton action={deleteFilterDefinition.bind(null, f.id)} confirmText={t.deleteConfirm(name)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
