import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Tag,
  Store as StoreIcon,
  ClipboardList,
  Settings,
  LogOut,
  ExternalLink,
  FolderTree,
  SlidersHorizontal,
  MessageSquareText,
  CreditCard,
  Users,
} from "lucide-react";
import { getCurrentAdminUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { getDict } from "@/i18n/get-dictionary";
import { LocaleSwitcher } from "@/i18n/locale-switcher";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin-panel-secret/login");

  // Sellers only ever get the till — keep them out of every admin-only page
  // regardless of which URL they land on or type in directly.
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (user.role === "SELLER" && !pathname.startsWith("/admin-panel-secret/pos")) {
    redirect("/admin-panel-secret/pos");
  }

  const { dict } = await getDict();
  const NAV =
    user.role === "SELLER"
      ? [{ href: "/admin-panel-secret/pos", label: dict.admin.nav.pos, icon: CreditCard }]
      : [
          { href: "/admin-panel-secret", label: dict.admin.nav.dashboard, icon: LayoutDashboard },
          { href: "/admin-panel-secret/pos", label: dict.admin.nav.pos, icon: CreditCard },
          { href: "/admin-panel-secret/products", label: dict.admin.nav.products, icon: Package },
          { href: "/admin-panel-secret/categories", label: dict.admin.nav.categories, icon: FolderTree },
          { href: "/admin-panel-secret/filters", label: dict.admin.nav.filters, icon: SlidersHorizontal },
          { href: "/admin-panel-secret/promotions", label: dict.admin.nav.promotions, icon: Tag },
          { href: "/admin-panel-secret/orders", label: dict.admin.nav.orders, icon: ClipboardList },
          { href: "/admin-panel-secret/reviews", label: dict.admin.nav.reviews, icon: MessageSquareText },
          { href: "/admin-panel-secret/stores", label: dict.admin.nav.stores, icon: StoreIcon },
          { href: "/admin-panel-secret/sellers", label: dict.admin.nav.sellers, icon: Users },
          { href: "/admin-panel-secret/settings", label: dict.admin.nav.settings, icon: Settings },
        ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:overflow-y-auto">
        <div className="mb-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              A
            </span>
            <span className="font-bold text-foreground">{dict.admin.nav.brandLabel}</span>
          </div>
        </div>
        <div className="mb-4 px-2 w-fit">
          <LocaleSwitcher />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              <item.icon size={17} className="text-primary" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t border-border pt-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <ExternalLink size={17} />
            {dict.admin.nav.openSite}
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-danger transition-colors hover:bg-surface-muted"
            >
              <LogOut size={17} />
              {dict.admin.nav.logout}
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
          <span className="font-bold text-foreground">{dict.admin.nav.brandLabel}</span>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <form action={logoutAction}>
              <button type="submit" className="text-sm text-danger">
                {dict.admin.nav.logout}
              </button>
            </form>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-2 no-scrollbar lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
