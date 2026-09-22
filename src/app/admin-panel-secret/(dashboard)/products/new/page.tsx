import { prisma } from "@/lib/prisma";
import { createProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/product-form";
import { getDict } from "@/i18n/get-dictionary";

export default async function NewProductPage() {
  const [categories, stores, { dict }] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.store.findMany({ orderBy: { order: "asc" } }),
    getDict(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{dict.admin.products.newTitle}</h1>
      <ProductForm action={createProduct} categories={categories} stores={stores} />
    </div>
  );
}
