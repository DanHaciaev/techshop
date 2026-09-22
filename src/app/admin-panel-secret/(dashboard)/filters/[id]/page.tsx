import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateFilterDefinition } from "@/lib/actions/filters";
import { getDict } from "@/i18n/get-dictionary";
import { pick } from "@/i18n/pick";

export default async function EditFilterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [definition, categories, { locale, dict }] = await Promise.all([
    prisma.filterDefinition.findUnique({ where: { id } }),
    prisma.category.findMany({ where: { parentId: null }, orderBy: { order: "asc" } }),
    getDict(),
  ]);
  if (!definition) notFound();
  const t = dict.admin.filters;

  async function action(formData: FormData) {
    "use server";
    await updateFilterDefinition(id, formData);
    redirect("/admin-panel-secret/filters");
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{t.editTitle}</h1>
      <form action={action} className="flex max-w-md flex-col gap-4 rounded-card border border-border bg-surface p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.name}</label>
          <input
            name="name"
            defaultValue={definition.name}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.nameRo}</label>
          <input
            name="nameRo"
            defaultValue={definition.nameRo}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.scope}</label>
          <select
            name="categoryId"
            defaultValue={definition.categoryId ?? ""}
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
            defaultValue={definition.order}
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
