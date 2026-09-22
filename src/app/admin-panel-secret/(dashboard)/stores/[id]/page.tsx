import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateStore } from "@/lib/actions/stores";
import { Checkbox } from "@/components/ui/checkbox";
import { getDict } from "@/i18n/get-dictionary";

export default async function EditStorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [store, { dict }] = await Promise.all([
    prisma.store.findUnique({ where: { id } }),
    getDict(),
  ]);
  if (!store) notFound();
  const t = dict.admin.stores;

  async function action(formData: FormData) {
    "use server";
    await updateStore(id, formData);
    redirect("/admin-panel-secret/stores");
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{t.editTitle}</h1>
      <form action={action} className="grid max-w-2xl gap-4 rounded-card border border-border bg-surface p-5 sm:grid-cols-2">
        <Field label={t.name} name="name" defaultValue={store.name} required />
        <Field label={t.nameRo} name="nameRo" defaultValue={store.nameRo} />
        <Field label={t.city} name="city" defaultValue={store.city} />
        <Field label={t.cityRo} name="cityRo" defaultValue={store.cityRo} />
        <div className="sm:col-span-2">
          <Field label={t.address} name="address" defaultValue={store.address} required />
        </div>
        <div className="sm:col-span-2">
          <Field label={t.addressRo} name="addressRo" defaultValue={store.addressRo} />
        </div>
        <Field label={t.phone} name="phone" defaultValue={store.phone} />
        <Field label={t.hours} name="hours" defaultValue={store.hours} />
        <Field label={t.hoursRo} name="hoursRo" defaultValue={store.hoursRo} />
        <div className="flex items-center pt-2">
          <Checkbox name="active" defaultChecked={store.active} label={t.active} />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            {t.save}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
      />
    </div>
  );
}
