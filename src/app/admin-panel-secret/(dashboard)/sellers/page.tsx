import { Pencil } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createSeller, deleteSeller } from "@/lib/actions/sellers";
import { DeleteButton } from "@/components/admin/delete-button";
import { getDict } from "@/i18n/get-dictionary";
import { pick } from "@/i18n/pick";

export const dynamic = "force-dynamic";

export default async function AdminSellersPage() {
  const [sellers, stores, { locale, dict }] = await Promise.all([
    prisma.adminUser.findMany({ where: { role: "SELLER" }, include: { store: true }, orderBy: { createdAt: "desc" } }),
    prisma.store.findMany({ orderBy: { order: "asc" } }),
    getDict(),
  ]);
  const t = dict.admin.sellers;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t.hint}</p>
      </div>

      <form action={createSeller} className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.username}</label>
          <input
            name="username"
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.password}</label>
          <input
            name="password"
            type="text"
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.store}</label>
          <select
            name="storeId"
            defaultValue=""
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="" disabled>
              {t.selectStore}
            </option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {pick(s.name, s.nameRo, locale)}
              </option>
            ))}
          </select>
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

      {sellers.length === 0 ? (
        <p className="text-sm text-muted">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full min-w-120 text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t.colUsername}</th>
                <th className="px-4 py-3 font-medium">{t.colStore}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sellers.map((s) => (
                <tr key={s.id} className="hover:bg-surface-muted">
                  <td className="px-4 py-3 font-medium text-foreground">{s.username}</td>
                  <td className="px-4 py-3 text-muted">{s.store ? pick(s.store.name, s.store.nameRo, locale) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin-panel-secret/sellers/${s.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary"
                      >
                        <Pencil size={15} />
                      </Link>
                      <DeleteButton action={deleteSeller.bind(null, s.id)} confirmText={t.deleteConfirm(s.username)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
