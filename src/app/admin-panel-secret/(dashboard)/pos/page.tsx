import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminUser } from "@/lib/auth";
import { getCategoryTree } from "@/lib/data";
import { getDict } from "@/i18n/get-dictionary";
import { PosScreen } from "@/components/admin/pos-screen";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin-panel-secret/login");

  const { dict } = await getDict();

  const [stores, products, tree] = await Promise.all([
    user.role === "ADMIN" ? prisma.store.findMany({ where: { active: true }, orderBy: { order: "asc" } }) : Promise.resolve([]),
    prisma.product.findMany({
      where: { active: true },
      include: { storeStocks: true },
      orderBy: { name: "asc" },
    }),
    getCategoryTree(),
  ]);

  const initialStoreId = user.role === "SELLER" ? user.storeId : (stores[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{dict.admin.pos.title}</h1>
      <PosScreen
        role={user.role}
        stores={stores.map((s) => ({ id: s.id, name: s.name, nameRo: s.nameRo }))}
        initialStoreId={initialStoreId}
        tree={tree.map((c) => ({
          id: c.id,
          name: c.name,
          nameRo: c.nameRo,
          children: c.children.map((child) => ({ id: child.id, name: child.name, nameRo: child.nameRo })),
        }))}
        products={products.map((p) => ({
          id: p.id,
          categoryId: p.categoryId,
          name: p.name,
          nameRo: p.nameRo,
          price: p.price,
          image: p.image,
          sku: p.sku,
          stocksByStore: Object.fromEntries(p.storeStocks.map((s) => [s.storeId, s.quantity])),
        }))}
      />
    </div>
  );
}
