import Link from "next/link";
import Image from "next/image";
import { MapPin, Mail, Phone } from "lucide-react";
import { getSettings, getActiveStores } from "@/lib/data";
import { dictionaries } from "@/i18n/dictionaries";
import { L } from "@/i18n/l";

export async function Footer() {
  const [settings, stores] = await Promise.all([getSettings(), getActiveStores()]);

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            {settings.logoUrl ? (
              <span className="relative h-9 w-9 overflow-hidden rounded-xl">
                <Image src={settings.logoUrl} alt={settings.shopName} fill sizes="36px" unoptimized className="object-cover" />
              </span>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                {settings.shopName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="text-lg font-bold">{settings.shopName}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted">
            <L ru={dictionaries.ru.footer.description} ro={dictionaries.ro.footer.description} />
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 text-muted hover:text-foreground">
              <Phone size={15} /> {settings.phone}
            </a>
            <a href={`mailto:${settings.email}`} className="flex items-center gap-2 text-muted hover:text-foreground">
              <Mail size={15} /> {settings.email}
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">
            <L ru={dictionaries.ru.footer.storesHeading} ro={dictionaries.ro.footer.storesHeading} />
          </h3>
          <ul className="mt-3 space-y-3 text-sm">
            {stores.map((s) => (
              <li key={s.id} className="flex items-start gap-2 text-muted">
                <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
                <span>
                  <span className="font-medium text-foreground">
                    <L ru={s.name} ro={s.nameRo} />
                  </span>
                  {" — "}
                  <L ru={s.address} ro={s.addressRo} />, <L ru={s.city} ro={s.cityRo} />
                  {s.hours ? (
                    <span className="block text-xs">
                      <L ru={s.hours} ro={s.hoursRo} />
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">
            <L ru={dictionaries.ru.footer.infoHeading} ro={dictionaries.ro.footer.infoHeading} />
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/cart" className="text-muted hover:text-foreground">
                <L ru={dictionaries.ru.footer.cartLink} ro={dictionaries.ro.footer.cartLink} />
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-muted hover:text-foreground">
                <L ru={dictionaries.ru.footer.terms} ro={dictionaries.ro.footer.terms} />
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-muted hover:text-foreground">
                <L ru={dictionaries.ru.footer.privacy} ro={dictionaries.ro.footer.privacy} />
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {settings.shopName}.{" "}
        <L ru={dictionaries.ru.footer.rights} ro={dictionaries.ro.footer.rights} />
      </div>
    </footer>
  );
}
