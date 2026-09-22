import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Headset } from "lucide-react";
import {
  getActivePromotions,
  getCategoryTree,
  getPopularProducts,
} from "@/lib/data";
import { dictionaries } from "@/i18n/dictionaries";
import { L } from "@/i18n/l";
import { PromoCarousel } from "@/components/shop/promo-carousel";
import { CategoryTiles } from "@/components/shop/category-tiles";
import { ProductCard } from "@/components/shop/product-card";

export const revalidate = 60;

export default async function Home() {
  const [promotions, tree, popular] = await Promise.all([
    getActivePromotions(),
    getCategoryTree(),
    getPopularProducts(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <section className="animate-fade-in">
        <PromoCarousel promotions={promotions} />
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            <L ru={dictionaries.ru.home.categoriesTitle} ro={dictionaries.ro.home.categoriesTitle} />
          </h2>
          <Link
            href="/catalog"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
          >
            <L ru={dictionaries.ru.catalog.allCategories} ro={dictionaries.ro.catalog.allCategories} /> <ArrowRight size={16} />
          </Link>
        </div>
        <CategoryTiles tree={tree} />
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            <L ru={dictionaries.ru.home.popularProducts} ro={dictionaries.ro.home.popularProducts} />
          </h2>
          <Link
            href="/catalog"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
          >
            <L ru={dictionaries.ru.home.viewAllCatalog} ro={dictionaries.ro.home.viewAllCatalog} /> <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {popular.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        <Perk
          icon={<Truck size={22} />}
          title={<L ru={dictionaries.ru.home.perkDeliveryTitle} ro={dictionaries.ro.home.perkDeliveryTitle} />}
          text={<L ru={dictionaries.ru.home.perkDeliveryText} ro={dictionaries.ro.home.perkDeliveryText} />}
        />
        <Perk
          icon={<ShieldCheck size={22} />}
          title={<L ru={dictionaries.ru.home.perkWarrantyTitle} ro={dictionaries.ro.home.perkWarrantyTitle} />}
          text={<L ru={dictionaries.ru.home.perkWarrantyText} ro={dictionaries.ro.home.perkWarrantyText} />}
        />
        <Perk
          icon={<Headset size={22} />}
          title={<L ru={dictionaries.ru.home.perkSupportTitle} ro={dictionaries.ro.home.perkSupportTitle} />}
          text={<L ru={dictionaries.ru.home.perkSupportText} ro={dictionaries.ro.home.perkSupportText} />}
        />
      </section>
    </div>
  );
}

function Perk({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  text: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-card border border-border bg-surface p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon}
      </span>
      <div>
        <div className="font-semibold text-foreground">{title}</div>
        <div className="text-sm text-muted">{text}</div>
      </div>
    </div>
  );
}
