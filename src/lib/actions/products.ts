"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { TAGS } from "@/lib/data";

const productSchema = z.object({
  name: z.string().trim().min(2, "Введите название"),
  nameRo: z.string().trim().optional().default(""),
  slug: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
  descriptionRo: z.string().trim().optional().default(""),
  price: z.coerce.number().positive("Цена должна быть больше нуля"),
  oldPrice: z.union([z.coerce.number().positive(), z.literal(""), z.undefined()]).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  categoryId: z.string().trim().optional().default(""),
  image: z.string().trim().optional().default(""),
  images: z.string().trim().optional().default("[]"),
  sku: z.string().trim().optional().default(""),
  attributes: z.string().trim().optional().default("[]"),
  storeStocks: z.string().trim().optional().default("[]"),
});

function productImageUrl(name: string, categoryName: string, seed: number) {
  const params = new URLSearchParams({ title: name, category: categoryName, seed: String(seed) });
  return `/api/og/product?${params.toString()}`;
}

function normalizeImages(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return "[]";
    return JSON.stringify(parsed.filter((v) => typeof v === "string" && v.trim()).map((v) => v.trim()));
  } catch {
    return "[]";
  }
}

function parseStoreStocks(raw: string): { storeId: string; quantity: number }[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => r && typeof r.storeId === "string")
      .map((r) => ({ storeId: r.storeId, quantity: Math.max(0, Number(r.quantity) || 0) }));
  } catch {
    return [];
  }
}

async function syncStoreStocks(productId: string, raw: string) {
  const rows = parseStoreStocks(raw);
  await Promise.all(
    rows.map((row) =>
      prisma.storeStock.upsert({
        where: { productId_storeId: { productId, storeId: row.storeId } },
        update: { quantity: row.quantity },
        create: { productId, storeId: row.storeId, quantity: row.quantity },
      })
    )
  );
}

export async function createProduct(formData: FormData) {
  const parsed = productSchema.parse(Object.fromEntries(formData));
  const featured = formData.get("featured") === "on";
  const active = formData.get("active") === "on";

  const category = parsed.categoryId
    ? await prisma.category.findUnique({ where: { id: parsed.categoryId } })
    : null;

  const slug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.name);
  const seed = Math.floor(Math.random() * 1000);

  const product = await prisma.product.create({
    data: {
      name: parsed.name,
      nameRo: parsed.nameRo,
      slug,
      description: parsed.description,
      descriptionRo: parsed.descriptionRo,
      price: parsed.price,
      oldPrice: parsed.oldPrice ? Number(parsed.oldPrice) : null,
      stock: parsed.stock,
      categoryId: parsed.categoryId || null,
      sku: parsed.sku,
      attributes: parsed.attributes,
      images: normalizeImages(parsed.images),
      featured,
      active,
      image: parsed.image || productImageUrl(parsed.name, category?.name ?? "", seed),
    },
  });
  await syncStoreStocks(product.id, parsed.storeStocks);

  updateTag(TAGS.products);
  updateTag(TAGS.stores);
  redirect("/admin-panel-secret/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const parsed = productSchema.parse(Object.fromEntries(formData));
  const featured = formData.get("featured") === "on";
  const active = formData.get("active") === "on";

  await prisma.product.update({
    where: { id },
    data: {
      name: parsed.name,
      nameRo: parsed.nameRo,
      slug: parsed.slug ? slugify(parsed.slug) : slugify(parsed.name),
      description: parsed.description,
      descriptionRo: parsed.descriptionRo,
      price: parsed.price,
      oldPrice: parsed.oldPrice ? Number(parsed.oldPrice) : null,
      stock: parsed.stock,
      categoryId: parsed.categoryId || null,
      sku: parsed.sku,
      attributes: parsed.attributes,
      images: normalizeImages(parsed.images),
      image: parsed.image,
      featured,
      active,
    },
  });
  await syncStoreStocks(id, parsed.storeStocks);

  updateTag(TAGS.products);
  updateTag(TAGS.stores);
  redirect("/admin-panel-secret/products");
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  updateTag(TAGS.products);
  updateTag(TAGS.promotions);
}
