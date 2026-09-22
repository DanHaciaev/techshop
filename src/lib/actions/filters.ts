"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/data";

const filterSchema = z.object({
  name: z.string().trim().min(1, "Введите название"),
  nameRo: z.string().trim().optional().default(""),
  order: z.coerce.number().int().default(0),
  categoryId: z.string().trim().optional().default(""),
});

export async function createFilterDefinition(formData: FormData) {
  const parsed = filterSchema.parse(Object.fromEntries(formData));
  await prisma.filterDefinition.create({
    data: {
      name: parsed.name,
      nameRo: parsed.nameRo,
      order: parsed.order,
      categoryId: parsed.categoryId || null,
    },
  });
  updateTag(TAGS.filters);
}

export async function updateFilterDefinition(id: string, formData: FormData) {
  const parsed = filterSchema.parse(Object.fromEntries(formData));
  await prisma.filterDefinition.update({
    where: { id },
    data: {
      name: parsed.name,
      nameRo: parsed.nameRo,
      order: parsed.order,
      categoryId: parsed.categoryId || null,
    },
  });
  updateTag(TAGS.filters);
}

export async function deleteFilterDefinition(id: string) {
  await prisma.filterDefinition.delete({ where: { id } });
  updateTag(TAGS.filters);
}
