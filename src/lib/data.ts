import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Category, Prisma } from "@prisma/client";

export type CategoryTreeNode = Category & { children: Category[] };

export const TAGS = {
  settings: "settings",
  categories: "categories",
  products: "products",
  promotions: "promotions",
  stores: "stores",
  filters: "filters",
  reviews: "reviews",
  orders: "orders",
} as const;

export const getSettings = unstable_cache(
  async () => {
    const settings = await prisma.settings.findUnique({ where: { id: "main" } });
    return (
      settings ??
      (await prisma.settings.create({
        data: { id: "main" },
      }))
    );
  },
  ["settings"],
  { tags: [TAGS.settings] }
);

export const getCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({ orderBy: { order: "asc" } });
  },
  ["categories"],
  { tags: [TAGS.categories] }
);

/** Top-level categories with their subcategories nested underneath. */
export const getCategoryTree = unstable_cache(
  async () => {
    const all = await prisma.category.findMany({ orderBy: { order: "asc" } });
    const bySlugParent = all.filter((c) => !c.parentId);
    return bySlugParent.map((parent) => ({
      ...parent,
      children: all.filter((c) => c.parentId === parent.id),
    }));
  },
  ["categories-tree"],
  { tags: [TAGS.categories] }
);

export const getActivePromotions = unstable_cache(
  async () => {
    return prisma.promotion.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
  },
  ["promotions-active"],
  { tags: [TAGS.promotions] }
);

export const getAllPromotions = unstable_cache(
  async () => {
    return prisma.promotion.findMany({ orderBy: { order: "asc" } });
  },
  ["promotions-all"],
  { tags: [TAGS.promotions] }
);

export const getPromotionBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.promotion.findUnique({
      where: { slug },
      include: {
        products: { include: { product: { include: { category: true } } } },
      },
    });
  },
  ["promotion-by-slug"],
  { tags: [TAGS.promotions] }
);

/**
 * Total quantity sold per product, derived from real orders (canceled orders
 * don't count). This is the single source of truth for "popularity" across
 * the storefront — no manual admin flag involved.
 */
export const getProductSalesMap = unstable_cache(
  async () => {
    const grouped = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null }, order: { status: { not: "CANCELED" } } },
      _sum: { quantity: true },
    });
    const map: Record<string, number> = {};
    for (const g of grouped) {
      if (g.productId) map[g.productId] = g._sum.quantity ?? 0;
    }
    return map;
  },
  ["product-sales-map"],
  { tags: [TAGS.orders] }
);

export const getPopularProducts = unstable_cache(
  async (limit = 8) => {
    const [products, salesMap] = await Promise.all([
      prisma.product.findMany({ where: { active: true }, include: { category: true } }),
      getProductSalesMap(),
    ]);
    return [...products]
      .sort((a, b) => {
        const diff = (salesMap[b.id] ?? 0) - (salesMap[a.id] ?? 0);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);
  },
  ["products-popular"],
  { tags: [TAGS.products, TAGS.orders] }
);

/**
 * Resolves a category slug to itself plus all descendant category ids.
 * Viewing a parent category shows products from every subcategory beneath it;
 * viewing a subcategory (or a category with no children) shows only its own.
 */
export const getCategoryWithDescendantIds = unstable_cache(
  async (slug: string) => {
    const all = await prisma.category.findMany();
    const current = all.find((c) => c.slug === slug);
    if (!current) return null;

    const ids = [current.id];
    const collectChildren = (parentId: string) => {
      for (const c of all) {
        if (c.parentId === parentId) {
          ids.push(c.id);
          collectChildren(c.id);
        }
      }
    };
    collectChildren(current.id);

    return { category: current, categoryIds: ids, all };
  },
  ["category-descendants"],
  { tags: [TAGS.categories] }
);

// Catalog pages fetch the full (unfiltered) list statically — search, price
// range and sorting are applied client-side (see CatalogBrowser) so that
// filtering is instant and the page itself stays static/ISR-cacheable.
export const getProducts = unstable_cache(
  async (params: { categoryIds?: string[] } = {}) => {
    const where: Prisma.ProductWhereInput = {
      active: true,
      categoryId: params.categoryIds ? { in: params.categoryIds } : undefined,
    };
    return prisma.product.findMany({ where, include: { category: true }, orderBy: { createdAt: "desc" } });
  },
  ["products-list"],
  { tags: [TAGS.products] }
);

export const getProductBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        storeStocks: { include: { store: true }, where: { store: { active: true } } },
        reviews: { orderBy: { createdAt: "desc" } },
      },
    });
  },
  ["product-by-slug"],
  { tags: [TAGS.products, TAGS.stores, TAGS.reviews] }
);

export const getRelatedProducts = unstable_cache(
  async (categoryId: string | null, excludeId: string) => {
    if (!categoryId) return [];
    return prisma.product.findMany({
      where: { categoryId, active: true, id: { not: excludeId } },
      take: 4,
    });
  },
  ["products-related"],
  { tags: [TAGS.products] }
);

/**
 * Filter facet definitions configured in the admin. `categoryId: null` means
 * "applies everywhere". Returns global definitions plus any scoped to the
 * given top-level category, ordered together. Empty array means the admin
 * hasn't configured anything for this scope — callers should fall back to
 * auto-deriving facets from product attributes.
 */
export const getFilterDefinitionsFor = unstable_cache(
  async (categoryId: string | null) => {
    return prisma.filterDefinition.findMany({
      where: categoryId ? { OR: [{ categoryId: null }, { categoryId }] } : { categoryId: null },
      orderBy: { order: "asc" },
    });
  },
  ["filter-definitions"],
  { tags: [TAGS.filters] }
);

export const getAllFilterDefinitions = unstable_cache(
  async () => {
    return prisma.filterDefinition.findMany({
      include: { category: true },
      orderBy: { order: "asc" },
    });
  },
  ["filter-definitions-all"],
  { tags: [TAGS.filters] }
);

export const getActiveStores = unstable_cache(
  async () => {
    return prisma.store.findMany({ where: { active: true }, orderBy: { order: "asc" } });
  },
  ["stores-active"],
  { tags: [TAGS.stores] }
);
