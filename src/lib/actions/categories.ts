"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { TAGS } from "@/lib/data";

const categorySchema = z.object({
  name: z.string().trim().min(2, "Введите название"),
  nameRo: z.string().trim().optional().default(""),
  order: z.coerce.number().int().default(0),
  parentId: z.string().trim().optional().default(""),
});

export async function createCategory(formData: FormData) {
  const parsed = categorySchema.parse(Object.fromEntries(formData));
  await prisma.category.create({
    data: {
      name: parsed.name,
      nameRo: parsed.nameRo,
      slug: slugify(parsed.name),
      order: parsed.order,
      parentId: parsed.parentId || null,
    },
  });
  updateTag(TAGS.categories);
}

export async function updateCategory(id: string, formData: FormData) {
  const parsed = categorySchema.parse(Object.fromEntries(formData));
  await prisma.category.update({
    where: { id },
    data: {
      name: parsed.name,
      nameRo: parsed.nameRo,
      order: parsed.order,
      parentId: parsed.parentId || null,
    },
  });
  updateTag(TAGS.categories);
}

export async function deleteCategory(id: string) {
  await prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  await prisma.category.delete({ where: { id } });
  updateTag(TAGS.categories);
  updateTag(TAGS.products);
}
