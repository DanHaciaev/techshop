import { prisma } from "@/lib/prisma";
import { createPromotion } from "@/lib/actions/promotions";
import { PromotionForm } from "@/components/admin/promotion-form";
import { getDict } from "@/i18n/get-dictionary";

export default async function NewPromotionPage() {
  const [products, { dict }] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" }, include: { category: true } }),
    getDict(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{dict.admin.promotions.newPromotion}</h1>
      <PromotionForm action={createPromotion} products={products} />
    </div>
  );
}
