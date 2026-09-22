"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/data";
import { getCurrentAdminUser } from "@/lib/auth";

const itemSchema = z.object({ productId: z.string(), quantity: z.number().int().positive() });
const createPosSaleSchema = z.object({
  items: z.array(itemSchema).min(1),
  paymentMethod: z.enum(["cash", "card"]),
  storeId: z.string().trim().optional(),
});

class InsufficientStockError extends Error {
  constructor(
    public productName: string,
    public available: number
  ) {
    super("insufficient_stock");
  }
}

/**
 * Creates and immediately completes an in-store sale for the CURRENTLY
 * LOGGED IN seller's own store — storeId is always derived from the
 * session, never trusted from the caller. Decrements both the product's
 * overall stock and that store's own StoreStock row, same transactional
 * "re-check inside the transaction" pattern as the online checkout in
 * app/api/orders/route.ts.
 */
export async function createPosSale(input: {
  items: { productId: string; quantity: number }[];
  paymentMethod: "cash" | "card";
  storeId?: string;
}): Promise<{ orderId: string } | { error: string }> {
  const user = await getCurrentAdminUser();
  if (!user) throw new Error("Требуется вход в систему.");
  const parsed = createPosSaleSchema.parse(input);

  // SELLER is always pinned to their own store, regardless of what's sent —
  // never trust a client-provided storeId for that role. ADMIN operates any
  // store's till and must pick one explicitly.
  let storeId: string;
  if (user.role === "SELLER") {
    if (!user.storeId) throw new Error("Продавец не привязан к магазину.");
    storeId = user.storeId;
  } else {
    if (!parsed.storeId) throw new Error("Выберите магазин.");
    storeId = parsed.storeId;
  }

  const productIds = parsed.items.map((i) => i.productId);

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const freshProducts = await tx.product.findMany({ where: { id: { in: productIds } } });
      for (const item of parsed.items) {
        const product = freshProducts.find((p) => p.id === item.productId);
        if (!product || product.stock < item.quantity) {
          throw new InsufficientStockError(product?.name ?? "", product?.stock ?? 0);
        }
      }

      const orderItems = parsed.items.map((i) => {
        const product = freshProducts.find((p) => p.id === i.productId)!;
        return { productId: product.id, name: product.name, price: product.price, quantity: i.quantity };
      });
      const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

      const created = await tx.order.create({
        data: {
          customerName: "Покупатель в магазине",
          customerPhone: "",
          deliveryType: "pickup",
          storeId,
          status: "COMPLETED",
          total,
          source: "pos",
          paymentMethod: parsed.paymentMethod,
          paidAt: new Date(),
          items: { create: orderItems },
        },
      });

      for (const item of parsed.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
        const storeStock = await tx.storeStock.findUnique({
          where: { productId_storeId: { productId: item.productId, storeId } },
        });
        if (storeStock && storeStock.quantity > 0) {
          await tx.storeStock.update({
            where: { id: storeStock.id },
            data: { quantity: Math.max(0, storeStock.quantity - item.quantity) },
          });
        }
      }

      return created;
    });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return {
        error: err.productName
          ? `Товара «${err.productName}» недостаточно на складе (осталось ${err.available} шт.)`
          : "Одного из товаров недостаточно на складе",
      };
    }
    throw err;
  }

  updateTag(TAGS.products);
  updateTag(TAGS.orders);
  updateTag(TAGS.stores);

  return { orderId: order.id };
}
