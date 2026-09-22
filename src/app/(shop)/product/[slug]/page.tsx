import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, PackageCheck, PackageX, Store as StoreIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getProductBySlug, getRelatedProducts } from "@/lib/data";
import { createReview } from "@/lib/actions/reviews";
import { formatPrice } from "@/lib/utils";
import { dictionaries } from "@/i18n/dictionaries";
import { L } from "@/i18n/l";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { CompareButton } from "@/components/shop/compare-button";
import { ProductCard } from "@/components/shop/product-card";
import { InstallmentCalculator } from "@/components/shop/installment-calculator";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductTabs } from "@/components/shop/product-tabs";

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "404" };
  return {
    title: product.name,
    description: product.description || undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id);
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(100 - (product.price / product.oldPrice) * 100)
      : null;

  type Attribute = { name: string; nameRo?: string; value: string; valueRo?: string };
  let attributes: Attribute[] = [];
  try {
    const parsed = JSON.parse(product.attributes);
    if (Array.isArray(parsed)) attributes = parsed;
  } catch {
    attributes = [];
  }

  let extraImages: string[] = [];
  try {
    const parsed = JSON.parse(product.images);
    if (Array.isArray(parsed)) extraImages = parsed.filter((v) => typeof v === "string");
  } catch {
    extraImages = [];
  }
  const gallery = [product.image, ...extraImages].filter(Boolean);

  const submitReview = createReview.bind(null, product.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center gap-1 text-sm text-muted">
        <Link href="/catalog" className="hover:text-foreground">
          <L ru={dictionaries.ru.product.breadcrumbCatalog} ro={dictionaries.ro.product.breadcrumbCatalog} />
        </Link>
        {product.category ? (
          <>
            <ChevronRight size={14} />
            <Link href={`/catalog/${product.category.slug}`} className="hover:text-foreground">
              <L ru={product.category.name} ro={product.category.nameRo} />
            </Link>
          </>
        ) : null}
        <ChevronRight size={14} />
        <span className="text-foreground">
          <L ru={product.name} ro={product.nameRo} />
        </span>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery name={product.name} images={gallery} discount={discount} />

        <div className="flex flex-col">
          {product.category ? (
            <span className="text-sm text-muted">
              <L ru={product.category.name} ro={product.category.nameRo} />
            </span>
          ) : null}
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            <L ru={product.name} ro={product.nameRo} />
          </h1>

          {product.sku ? (
            <div className="mt-2 text-xs text-muted">
              <L ru={dictionaries.ru.product.sku(product.sku)} ro={dictionaries.ro.product.sku(product.sku)} />
            </div>
          ) : null}

          <div className="mt-5 flex items-center gap-3">
            <span className="text-3xl font-bold text-foreground">{formatPrice(product.price)}</span>
            {product.oldPrice ? (
              <span className="text-lg text-muted line-through">{formatPrice(product.oldPrice)}</span>
            ) : null}
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            {product.stock > 0 ? (
              <span className="flex items-center gap-1.5 text-success">
                <PackageCheck size={16} />{" "}
                <L ru={dictionaries.ru.product.inStock(product.stock)} ro={dictionaries.ro.product.inStock(product.stock)} />
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-danger">
                <PackageX size={16} /> <L ru={dictionaries.ru.product.outOfStock} ro={dictionaries.ro.product.outOfStock} />
              </span>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2">
            <AddToCartButton product={product} />
            <CompareButton productId={product.id} />
          </div>

          <div className="mt-4">
            <InstallmentCalculator price={product.price} />
          </div>

          {product.storeStocks.length > 0 ? (
            <div className="mt-6 border-t border-border pt-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                <StoreIcon size={17} className="text-primary" />
                <L ru={dictionaries.ru.product.storeAvailability} ro={dictionaries.ro.product.storeAvailability} />
              </h2>
              <div className="flex flex-col divide-y divide-border text-sm">
                {product.storeStocks.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-4 py-2">
                    <span className="text-foreground">
                      <L ru={s.store.name} ro={s.store.nameRo} />
                    </span>
                    {s.quantity > 0 ? (
                      <span className="text-success">
                        <L
                          ru={dictionaries.ru.product.inStoreCount(s.quantity)}
                          ro={dictionaries.ro.product.inStoreCount(s.quantity)}
                        />
                      </span>
                    ) : (
                      <span className="text-danger">
                        <L ru={dictionaries.ru.product.outOfStoreStock} ro={dictionaries.ro.product.outOfStoreStock} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ProductTabs
        descriptionRu={product.description}
        descriptionRo={product.descriptionRo}
        attributes={attributes}
        reviews={product.reviews}
        onSubmitReview={submitReview}
      />

      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-bold text-foreground">
            <L ru={dictionaries.ru.product.related} ro={dictionaries.ro.product.related} />
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={{ ...p, category: product.category }} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
