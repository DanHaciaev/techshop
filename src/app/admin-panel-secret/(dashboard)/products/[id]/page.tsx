import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/product-form";
import { getDict } from "@/i18n/get-dictionary";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, stores, storeStocks, { dict }] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.store.findMany({ orderBy: { order: "asc" } }),
    prisma.storeStock.findMany({ where: { productId: id } }),
    getDict(),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{dict.admin.products.editTitle}</h1>
      <ProductForm
        action={updateProduct.bind(null, id)}
        categories={categories}
        stores={stores}
        product={product}
        storeStocks={storeStocks}
      />
    </div>
  );
}
