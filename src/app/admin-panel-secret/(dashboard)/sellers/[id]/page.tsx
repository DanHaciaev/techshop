import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateSeller } from "@/lib/actions/sellers";
import { getDict } from "@/i18n/get-dictionary";
import { pick } from "@/i18n/pick";

export default async function EditSellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [seller, stores, { locale, dict }] = await Promise.all([
    prisma.adminUser.findUnique({ where: { id } }),
    prisma.store.findMany({ orderBy: { order: "asc" } }),
    getDict(),
  ]);
  if (!seller || seller.role !== "SELLER") notFound();
  const t = dict.admin.sellers;

  async function action(formData: FormData) {
    "use server";
    await updateSeller(id, formData);
    redirect("/admin-panel-secret/sellers");
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{t.editTitle(seller.username)}</h1>
      <form action={action} className="flex max-w-md flex-col gap-4 rounded-card border border-border bg-surface p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.store}</label>
          <select
            name="storeId"
            defaultValue={seller.storeId ?? ""}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {pick(s.name, s.nameRo, locale)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.newPassword}</label>
          <input
            name="password"
            type="text"
            placeholder={t.newPasswordPlaceholder}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {t.save}
        </button>
      </form>
    </div>
  );
}
