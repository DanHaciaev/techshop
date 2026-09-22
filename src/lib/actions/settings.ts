"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/data";

const settingsSchema = z.object({
  shopName: z.string().trim().min(2, "Введите название магазина"),
  logoUrl: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  addressRo: z.string().trim().optional().default(""),
  accentColor: z.string().trim().optional().default("#2563eb"),
});

export async function updateSettings(formData: FormData) {
  const parsed = settingsSchema.parse(Object.fromEntries(formData));
  await prisma.settings.upsert({
    where: { id: "main" },
    update: parsed,
    create: { id: "main", ...parsed },
  });
  updateTag(TAGS.settings);
}
