"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  username: z.string().trim().min(3, "Минимум 3 символа"),
  password: z.string().min(4, "Минимум 4 символа"),
  storeId: z.string().trim().min(1, "Выберите магазин"),
});

const updateSchema = z.object({
  password: z.string().optional().default(""),
  storeId: z.string().trim().min(1, "Выберите магазин"),
});

export async function createSeller(formData: FormData) {
  const parsed = createSchema.parse(Object.fromEntries(formData));
  const passwordHash = await bcrypt.hash(parsed.password, 10);
  await prisma.adminUser.create({
    data: {
      username: parsed.username,
      password: passwordHash,
      role: "SELLER",
      storeId: parsed.storeId,
    },
  });
}

export async function updateSeller(id: string, formData: FormData) {
  const parsed = updateSchema.parse(Object.fromEntries(formData));
  await prisma.adminUser.update({
    where: { id },
    data: {
      storeId: parsed.storeId,
      ...(parsed.password ? { password: await bcrypt.hash(parsed.password, 10) } : {}),
    },
  });
}

export async function deleteSeller(id: string) {
  await prisma.adminUser.delete({ where: { id } });
}
