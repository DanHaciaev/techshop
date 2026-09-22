import Link from "next/link";
import Image from "next/image";
import { Phone } from "lucide-react";
import { getSettings, getCategoryTree } from "@/lib/data";
import { ThemeToggle } from "@/components/theme-toggle";
import { CartButton } from "@/components/shop/cart-button";
import { MobileNav } from "@/components/shop/mobile-nav";
import { HeaderSearch } from "@/components/shop/header-search";
import { LocaleSwitcher } from "@/i18n/locale-switcher";

export async function Header() {
  const [settings, tree] = await Promise.all([getSettings(), getCategoryTree()]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur supports-backdrop-filter:bg-surface/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <MobileNav tree={tree} />

        <Link href="/" className="flex shrink-0 items-center gap-2">
          {settings.logoUrl ? (
            <span className="relative h-9 w-9 overflow-hidden rounded-xl">
              <Image src={settings.logoUrl} alt={settings.shopName} fill sizes="36px" unoptimized className="object-cover" />
            </span>
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              {settings.shopName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="hidden whitespace-nowrap text-lg font-bold tracking-tight sm:inline">{settings.shopName}</span>
        </Link>

        <div className="min-w-0 flex-1">
          <HeaderSearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <a
            href={`tel:${settings.phone.replace(/\s+/g, "")}`}
            className="hidden items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-muted xl:flex"
          >
            <Phone size={16} className="text-primary" />
            {settings.phone}
          </a>
          <LocaleSwitcher className="hidden sm:flex" />
          <ThemeToggle />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
