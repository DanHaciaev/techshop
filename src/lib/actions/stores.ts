"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/data";

const storeSchema = z.object({
  name: z.string().trim().min(2, "Введите название"),
  nameRo: z.string().trim().optional().default(""),
  address: z.string().trim().min(2, "Введите адрес"),
  addressRo: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  cityRo: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  hours: z.string().trim().optional().default(""),
  hoursRo: z.string().trim().optional().default(""),
  order: z.coerce.number().int().default(0),
});

export async function createStore(formData: FormData) {
  const parsed = storeSchema.parse(Object.fromEntries(formData));
  const active = formData.get("active") === "on";
  await prisma.store.create({ data: { ...parsed, active } });
  updateTag(TAGS.stores);
}

export async function updateStore(id: string, formData: FormData) {
  const parsed = storeSchema.parse(Object.fromEntries(formData));
  const active = formData.get("active") === "on";
  await prisma.store.update({ where: { id }, data: { ...parsed, active } });
  updateTag(TAGS.stores);
}

export async function deleteStore(id: string) {
  await prisma.store.delete({ where: { id } });
  updateTag(TAGS.stores);
}
