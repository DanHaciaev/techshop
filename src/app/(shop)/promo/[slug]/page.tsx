import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getPromotionBySlug } from "@/lib/data";
import { dictionaries } from "@/i18n/dictionaries";
import { L } from "@/i18n/l";
import { ProductCard } from "@/components/shop/product-card";

export const revalidate = 60;

export async function generateStaticParams() {
  const promotions = await prisma.promotion.findMany({ select: { slug: true } });
  return promotions.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const promo = await getPromotionBySlug(slug);
  if (!promo) return { title: "404" };
  return {
    title: promo.title,
    description: promo.subtitle || promo.description || undefined,
  };
}

export default async function PromotionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const promo = await getPromotionBySlug(slug);
  if (!promo || !promo.active) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="relative aspect-16/7 w-full min-h-45 overflow-hidden rounded-card bg-surface-muted sm:min-h-60">
        <Image
          src={promo.image || "/images/placeholder.svg"}
          alt={promo.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="mt-6 max-w-3xl">
        {promo.badge ? (
          <span className="mb-3 inline-block rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
            <L ru={promo.badge} ro={promo.badgeRo} />
          </span>
        ) : null}
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          <L ru={promo.title} ro={promo.titleRo} />
        </h1>
        {promo.subtitle ? (
          <p className="mt-2 text-lg text-muted">
            <L ru={promo.subtitle} ro={promo.subtitleRo} />
          </p>
        ) : null}
        {promo.description ? (
          <p className="mt-4 leading-relaxed text-muted">
            <L ru={promo.description} ro={promo.descriptionRo} />
          </p>
        ) : null}
      </div>

      <section className="mt-10">
        <h2 className="mb-5 text-xl font-bold text-foreground">
          <L ru={dictionaries.ru.promo.products} ro={dictionaries.ro.promo.products} />
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {promo.products.map(({ product }) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {promo.products.length === 0 ? (
            <p className="col-span-full text-muted">
              <L ru={dictionaries.ru.promo.noProducts} ro={dictionaries.ro.promo.noProducts} />
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
