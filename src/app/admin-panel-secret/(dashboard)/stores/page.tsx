import Link from "next/link";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createStore, deleteStore } from "@/lib/actions/stores";
import { DeleteButton } from "@/components/admin/delete-button";
import { Checkbox } from "@/components/ui/checkbox";
import { getDict } from "@/i18n/get-dictionary";
import { pick } from "@/i18n/pick";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  const [stores, { locale, dict }] = await Promise.all([
    prisma.store.findMany({ orderBy: { order: "asc" } }),
    getDict(),
  ]);
  const t = dict.admin.stores;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>

      <form action={createStore} className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t.name} name="name" required />
        <Field label={t.nameRo} name="nameRo" />
        <Field label={t.city} name="city" />
        <Field label={t.cityRo} name="cityRo" />
        <Field label={t.address} name="address" required />
        <Field label={t.addressRo} name="addressRo" />
        <Field label={t.phone} name="phone" />
        <Field label={t.hours} name="hours" placeholder={t.hoursPlaceholder} />
        <Field label={t.hoursRo} name="hoursRo" />
        <div className="flex items-end gap-4 pb-2.5">
          <Checkbox name="active" defaultChecked label={t.active} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            {t.add}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {stores.map((s) => {
          const name = pick(s.name, s.nameRo, locale);
          return (
            <div key={s.id} className="flex items-center gap-4 rounded-card border border-border bg-surface p-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground">
                  {name} {s.active ? null : <span className="text-xs text-muted">{t.hiddenTag}</span>}
                </div>
                <div className="text-sm text-muted">
                  {pick(s.address, s.addressRo, locale)}, {pick(s.city, s.cityRo, locale)} {s.phone ? `· ${s.phone}` : ""}{" "}
                  {s.hours ? `· ${pick(s.hours, s.hoursRo, locale)}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin-panel-secret/stores/${s.id}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary"
                >
                  <Pencil size={15} />
                </Link>
                <DeleteButton action={deleteStore.bind(null, s.id)} confirmText={t.deleteConfirm(name)} />
              </div>
            </div>
          );
        })}
        {stores.length === 0 ? <p className="text-muted">{t.empty}</p> : null}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
      />
    </div>
  );
}
