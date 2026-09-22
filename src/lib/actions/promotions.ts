"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { TAGS } from "@/lib/data";

const promotionSchema = z.object({
  title: z.string().trim().min(2, "Введите заголовок"),
  titleRo: z.string().trim().optional().default(""),
  slug: z.string().trim().optional().default(""),
  subtitle: z.string().trim().optional().default(""),
  subtitleRo: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
  descriptionRo: z.string().trim().optional().default(""),
  badge: z.string().trim().optional().default(""),
  badgeRo: z.string().trim().optional().default(""),
  image: z.string().trim().optional().default(""),
  order: z.coerce.number().int().default(0),
});

function promoImageUrl(title: string, subtitle: string, badge: string, seed: number) {
  const params = new URLSearchParams({ title, subtitle, badge, seed: String(seed) });
  return `/api/og/promo?${params.toString()}`;
}

function getSelectedProductIds(formData: FormData) {
  return formData.getAll("productIds").map(String).filter(Boolean);
}

export async function createPromotion(formData: FormData) {
  const parsed = promotionSchema.parse(Object.fromEntries(formData));
  const active = formData.get("active") === "on";
  const productIds = getSelectedProductIds(formData);
  const slug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.title);
  const seed = Math.floor(Math.random() * 1000);

  const promotion = await prisma.promotion.create({
    data: {
      title: parsed.title,
      titleRo: parsed.titleRo,
      slug,
      subtitle: parsed.subtitle,
      subtitleRo: parsed.subtitleRo,
      description: parsed.description,
      descriptionRo: parsed.descriptionRo,
      badge: parsed.badge,
      badgeRo: parsed.badgeRo,
      order: parsed.order,
      active,
      image: parsed.image || promoImageUrl(parsed.title, parsed.subtitle, parsed.badge, seed),
      products: { create: productIds.map((productId) => ({ productId })) },
    },
  });

  updateTag(TAGS.promotions);
  redirect(`/admin-panel-secret/promotions/${promotion.id}`);
}

export async function updatePromotion(id: string, formData: FormData) {
  const parsed = promotionSchema.parse(Object.fromEntries(formData));
  const active = formData.get("active") === "on";
  const productIds = getSelectedProductIds(formData);

  await prisma.$transaction([
    prisma.promotion.update({
      where: { id },
      data: {
        title: parsed.title,
        titleRo: parsed.titleRo,
        slug: parsed.slug ? slugify(parsed.slug) : slugify(parsed.title),
        subtitle: parsed.subtitle,
        subtitleRo: parsed.subtitleRo,
        description: parsed.description,
        descriptionRo: parsed.descriptionRo,
        badge: parsed.badge,
        badgeRo: parsed.badgeRo,
        order: parsed.order,
        active,
        image: parsed.image,
      },
    }),
    prisma.promotionProduct.deleteMany({ where: { promotionId: id } }),
    prisma.promotionProduct.createMany({
      data: productIds.map((productId) => ({ promotionId: id, productId })),
    }),
  ]);

  updateTag(TAGS.promotions);
  redirect("/admin-panel-secret/promotions");
}

export async function deletePromotion(id: string) {
  await prisma.promotion.delete({ where: { id } });
  updateTag(TAGS.promotions);
}
