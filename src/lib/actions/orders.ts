"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const statusSchema = z.enum(["NEW", "CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELED"]);

export async function updateOrderStatus(id: string, formData: FormData) {
  const status = statusSchema.parse(formData.get("status"));
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin-panel-secret/orders");
  revalidatePath(`/admin-panel-secret/orders/${id}`);
}
