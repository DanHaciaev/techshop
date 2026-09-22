"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Category, Product, Promotion } from "@prisma/client";
import { useDict, useLocale } from "@/i18n/locale-provider";
import { pick } from "@/i18n/pick";
import { Checkbox } from "@/components/ui/checkbox";

type ProductWithCategory = Product & { category: Category | null };

export function PromotionForm({
  action,
  products,
  promotion,
  selectedProductIds = [],
}: {
  action: (formData: FormData) => Promise<void>;
  products: ProductWithCategory[];
  promotion?: Promotion;
  selectedProductIds?: string[];
}) {
  const [imagePreview, setImagePreview] = useState(promotion?.image ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedProductIds));
  const dict = useDict();
  const locale = useLocale();
  const t = dict.admin.promotions;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; products: ProductWithCategory[] }>();
    for (const p of products) {
      const key = p.category?.id ?? "__none";
      const label = p.category ? pick(p.category.name, p.category.nameRo, locale) : dict.admin.products.noCategory;
      if (!map.has(key)) map.set(key, { label, products: [] });
      map.get(key)!.products.push(p);
    }
    return Array.from(map.values());
  }, [products, locale, dict.admin.products.noCategory]);

  function toggleGroup(groupProducts: ProductWithCategory[], selectAll: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of groupProducts) {
        if (selectAll) next.add(p.id);
        else next.delete(p.id);
      }
      return next;
    });
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid items-start gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <TextField label={t.titleField} name="title" defaultValue={promotion?.title} required />
          <TextField label={t.titleRoField} name="titleRo" defaultValue={promotion?.titleRo} />
          <TextField label={t.slug} name="slug" defaultValue={promotion?.slug} placeholder={t.slugPlaceholder} />
          <TextField label={t.subtitle} name="subtitle" defaultValue={promotion?.subtitle} />
          <TextField label={t.subtitleRo} name="subtitleRo" defaultValue={promotion?.subtitleRo} />
          <div className="grid grid-cols-2 gap-4">
            <TextField label={t.badge} name="badge" defaultValue={promotion?.badge} />
            <TextField label={t.badgeRo} name="badgeRo" defaultValue={promotion?.badgeRo} />
          </div>
          <TextField label={t.orderInCarousel} name="order" type="number" defaultValue={promotion?.order ?? 0} />
          <Checkbox name="active" defaultChecked={promotion?.active ?? true} label={t.showOnSite} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t.description}</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={promotion?.description}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t.descriptionRo}</label>
            <textarea
              name="descriptionRo"
              rows={4}
              defaultValue={promotion?.descriptionRo}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <TextField
            label={t.bannerUrl}
            name="image"
            defaultValue={promotion?.image}
            placeholder={t.bannerPlaceholder}
            onChange={(e) => setImagePreview(e.target.value)}
          />
          <div className="relative aspect-16/6 w-full overflow-hidden rounded-card border border-border bg-surface-muted">
            {imagePreview ? (
              <Image src={imagePreview} alt="" fill sizes="480px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">{t.noImage}</div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">{t.productsInPromo}</label>
              <span className="text-xs text-muted">{t.selectedCount(selected.size)}</span>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-card border border-border">
              {groups.map((group) => {
                const allSelected = group.products.every((p) => selected.has(p.id));
                const someSelected = group.products.some((p) => selected.has(p.id));
                return (
                  <div key={group.label} className="border-b border-border last:border-0">
                    <div className="flex items-center gap-3 bg-surface-muted px-3 py-2">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={(checked) => toggleGroup(group.products, checked)}
                        label={<span className="font-semibold text-foreground">{group.label}</span>}
                      />
                      <span className="ml-auto text-xs text-muted">{group.products.length}</span>
                    </div>
                    {group.products.map((p) => (
                      <div key={p.id} className="border-t border-border px-3 py-2 pl-8 hover:bg-surface-muted">
                        <Checkbox
                          name="productIds"
                          value={p.id}
                          checked={selected.has(p.id)}
                          onChange={() => toggle(p.id)}
                          label={pick(p.name, p.nameRo, locale)}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
              {products.length === 0 ? <p className="p-3 text-sm text-muted">{t.addProductsFirst}</p> : null}
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:w-fit sm:px-8"
      >
        {promotion ? t.saveChanges : t.submitNew}
      </button>
    </form>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  type?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        onChange={onChange}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
      />
    </div>
  );
}
