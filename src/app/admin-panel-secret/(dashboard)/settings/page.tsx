import { getSettings } from "@/lib/data";
import { updateSettings } from "@/lib/actions/settings";
import { getDict } from "@/i18n/get-dictionary";

export default async function AdminSettingsPage() {
  const [settings, { dict }] = await Promise.all([getSettings(), getDict()]);
  const t = dict.admin.settings;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
      <form action={updateSettings} className="grid max-w-2xl gap-4 rounded-card border border-border bg-surface p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label={t.shopName} name="shopName" defaultValue={settings.shopName} required />
        </div>
        <div className="sm:col-span-2">
          <Field label={t.logoUrl} name="logoUrl" defaultValue={settings.logoUrl} placeholder={t.logoPlaceholder} />
        </div>
        <Field label={t.phone} name="phone" defaultValue={settings.phone} />
        <Field label={t.email} name="email" defaultValue={settings.email} />
        <div className="sm:col-span-2">
          <Field label={t.address} name="address" defaultValue={settings.address} />
        </div>
        <div className="sm:col-span-2">
          <Field label={t.addressRo} name="addressRo" defaultValue={settings.addressRo} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t.accentColor}</label>
          <input
            type="color"
            name="accentColor"
            defaultValue={settings.accentColor}
            className="h-10 w-20 cursor-pointer rounded-lg border border-border bg-surface"
          />
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
      <p className="max-w-2xl text-sm text-muted">{t.helper}</p>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
      />
    </div>
  );
}
