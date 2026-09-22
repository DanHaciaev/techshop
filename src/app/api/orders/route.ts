import { NextResponse } from "next/server";
import { z } from "zod";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/data";

class InsufficientStockError extends Error {
  constructor(
    public productName: string,
    public available: number
  ) {
    super("insufficient_stock");
  }
}

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(6).max(30),
  customerEmail: z.string().trim().email().or(z.literal("")).default(""),
  deliveryType: z.enum(["delivery", "pickup"]),
  address: z.string().trim().max(300).default(""),
  storeId: z.string().trim().max(60).optional().nullable(),
  paymentMethod: z.enum(["on_site", "online"]).default("on_site"),
  comment: z.string().trim().max(500).default(""),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive().max(99),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные заказа" }, { status: 400 });
  }
  const data = parsed.data;

  if (data.deliveryType === "delivery" && !data.address) {
    return NextResponse.json({ error: "Укажите адрес доставки" }, { status: 400 });
  }
  if (data.deliveryType === "pickup" && !data.storeId) {
    return NextResponse.json({ error: "Выберите магазин для самовывоза" }, { status: 400 });
  }

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Один из товаров больше недоступен" }, { status: 400 });
  }

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Re-check stock inside the transaction against fresh rows, so two
      // concurrent checkouts for the last unit can't both succeed.
      const freshProducts = await tx.product.findMany({ where: { id: { in: productIds } } });
      for (const item of data.items) {
        const product = freshProducts.find((p) => p.id === item.productId);
        if (!product || product.stock < item.quantity) {
          throw new InsufficientStockError(product?.name ?? "", product?.stock ?? 0);
        }
      }

      const orderItems = data.items.map((i) => {
        const product = freshProducts.find((p) => p.id === i.productId)!;
        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: i.quantity,
        };
      });
      const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

      const created = await tx.order.create({
        data: {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          deliveryType: data.deliveryType,
          address: data.deliveryType === "delivery" ? data.address : "",
          storeId: data.deliveryType === "pickup" ? data.storeId : null,
          paymentMethod: data.paymentMethod,
          comment: data.comment,
          total,
          items: { create: orderItems },
        },
      });

      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Pickup orders draw from one specific store's shelf — reflect that
      // there too, not just the overall stock number.
      if (data.deliveryType === "pickup" && data.storeId) {
        for (const item of data.items) {
          const storeStock = await tx.storeStock.findUnique({
            where: { productId_storeId: { productId: item.productId, storeId: data.storeId } },
          });
          if (storeStock && storeStock.quantity > 0) {
            await tx.storeStock.update({
              where: { id: storeStock.id },
              data: { quantity: Math.max(0, storeStock.quantity - item.quantity) },
            });
          }
        }
      }

      return created;
    });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json(
        {
          error: err.productName
            ? `Товара «${err.productName}» недостаточно на складе (осталось ${err.available} шт.)`
            : "Одного из товаров недостаточно на складе",
        },
        { status: 400 }
      );
    }
    throw err;
  }

  updateTag(TAGS.products);
  updateTag(TAGS.orders);
  if (data.deliveryType === "pickup") updateTag(TAGS.stores);

  return NextResponse.json({ orderId: order.id });
}
