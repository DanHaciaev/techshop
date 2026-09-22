import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ products: [] });

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [{ name: { contains: q } }, { nameRo: { contains: q } }],
    },
    select: { id: true, slug: true, name: true, nameRo: true, price: true, oldPrice: true, image: true },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}
