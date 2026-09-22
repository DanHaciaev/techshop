import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCategory } from "@/lib/actions/categories";
import { getDict } from "@/i18n/get-dictionary";
import { pick } from "@/i18n/pick";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, allCategories, { locale, dict }] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    getDict(),
  ]);
  if (!category) notFound();
  const t = dict.admin.categories;
  const parentOptions = allCategories.filter((c) => !c.parentId && c.id !== category.id);

  async function action(formData: FormData) {
    "use server";
    await updateCategory(id, formData);
    redirect("/admin-panel-secret/categories");
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{t.editTitle}</h1>
      <form action={action} className="flex max-w-md flex-col gap-4 rounded-card border border-border bg-surface p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.name}</label>
          <input
            name="name"
            defaultValue={category.name}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.nameRo}</label>
          <input
            name="nameRo"
            defaultValue={category.nameRo}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.parentCategory}</label>
          <select
            name="parentId"
            defaultValue={category.parentId ?? ""}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">{t.noParent}</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {pick(c.name, c.nameRo, locale)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.orderLabel}</label>
          <input
            name="order"
            type="number"
            defaultValue={category.order}
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
