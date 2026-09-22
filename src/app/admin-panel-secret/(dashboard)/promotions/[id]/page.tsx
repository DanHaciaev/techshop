import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePromotion } from "@/lib/actions/promotions";
import { PromotionForm } from "@/components/admin/promotion-form";
import { getDict } from "@/i18n/get-dictionary";

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [promotion, products, { dict }] = await Promise.all([
    prisma.promotion.findUnique({ where: { id }, include: { products: true } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, include: { category: true } }),
    getDict(),
  ]);

  if (!promotion) notFound();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{dict.admin.promotions.editTitle}</h1>
      <PromotionForm
        action={updatePromotion.bind(null, id)}
        products={products}
        promotion={promotion}
        selectedProductIds={promotion.products.map((pp) => pp.productId)}
      />
    </div>
  );
}
