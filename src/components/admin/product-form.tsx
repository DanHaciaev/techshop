"use client";

import Image from "next/image";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Category, Product, Store, StoreStock } from "@prisma/client";
import { useDict, useLocale } from "@/i18n/locale-provider";
import { pick } from "@/i18n/pick";
import { Checkbox } from "@/components/ui/checkbox";

type Attribute = { name: string; nameRo: string; value: string; valueRo: string };

function parseAttributes(raw: string | undefined): Attribute[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore malformed data
  }
  return [];
}

function parseImages(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === "string");
  } catch {
    // ignore malformed data
  }
  return [];
}

export function ProductForm({
  action,
  categories,
  stores,
  product,
  storeStocks = [],
}: {
  action: (formData: FormData) => Promise<void>;
  categories: Category[];
  stores: Store[];
  product?: Product;
  storeStocks?: StoreStock[];
}) {
  const [imagePreview, setImagePreview] = useState(product?.image ?? "");
  const [images, setImages] = useState<string[]>(() => parseImages(product?.images));
  const [attributes, setAttributes] = useState<Attribute[]>(() => parseAttributes(product?.attributes));
  const [stockByStore, setStockByStore] = useState<Record<string, number>>(() =>
    Object.fromEntries(storeStocks.map((s) => [s.storeId, s.quantity]))
  );
  const dict = useDict();
  const locale = useLocale();
  const t = dict.admin.products;

  const topLevel = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  function updateAttribute(index: number, field: keyof Attribute, value: string) {
    setAttributes((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  }

  function addAttribute() {
    setAttributes((prev) => [...prev, { name: "", nameRo: "", value: "", valueRo: "" }]);
  }

  function removeAttribute(index: number) {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateImage(index: number, value: string) {
    setImages((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function addImage() {
    setImages((prev) => [...prev, ""]);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="attributes" value={JSON.stringify(attributes.filter((a) => a.name.trim()))} />
      <input type="hidden" name="images" value={JSON.stringify(images.filter((v) => v.trim()))} />
      <input
        type="hidden"
        name="storeStocks"
        value={JSON.stringify(Object.entries(stockByStore).map(([storeId, quantity]) => ({ storeId, quantity })))}
      />
      <div className="grid items-start gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <TextField label={t.name} name="name" defaultValue={product?.name} required />
          <TextField label={t.nameRo} name="nameRo" defaultValue={product?.nameRo} />
          <TextField label={t.slug} name="slug" defaultValue={product?.slug} placeholder={t.slugPlaceholder} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t.category}</label>
            <select
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">{t.noCategory}</option>
              {topLevel.map((parent) => (
                <optgroup key={parent.id} label={pick(parent.name, parent.nameRo, locale)}>
                  <option value={parent.id}>{pick(parent.name, parent.nameRo, locale)}</option>
                  {childrenOf(parent.id).map((child) => (
                    <option key={child.id} value={child.id}>
                      — {pick(child.name, child.nameRo, locale)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField label={t.price} name="price" type="number" step="0.01" defaultValue={product?.price} required />
            <TextField label={t.oldPrice} name="oldPrice" type="number" step="0.01" defaultValue={product?.oldPrice ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField label={t.stock} name="stock" type="number" defaultValue={product?.stock ?? 0} required />
            <TextField label={t.sku} name="sku" defaultValue={product?.sku} />
          </div>

          <div className="flex gap-6">
            <Checkbox label={t.showOnHome} name="featured" defaultChecked={product?.featured} />
            <Checkbox label={t.isActive} name="active" defaultChecked={product?.active ?? true} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <TextField
            label={t.imageUrl}
            name="image"
            defaultValue={product?.image}
            placeholder={t.imagePlaceholder}
            onChange={(e) => setImagePreview(e.target.value)}
          />
          <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-card border border-border bg-surface-muted">
            {imagePreview ? (
              <Image src={imagePreview} alt="" fill sizes="320px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">{t.noImage}</div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{t.gallery}</label>
              <button
                type="button"
                onClick={addImage}
                className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted"
              >
                <Plus size={13} /> {t.addImage}
              </button>
            </div>
            {images.length === 0 ? (
              <p className="text-sm text-muted">{t.noGalleryImages}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {images.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted">
                      {url ? <Image src={url} alt="" fill sizes="44px" className="object-cover" /> : null}
                    </div>
                    <input
                      value={url}
                      onChange={(e) => updateImage(i, e.target.value)}
                      placeholder={t.imagePlaceholder}
                      className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t.description}</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={product?.description}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t.descriptionRo}</label>
            <textarea
              name="descriptionRo"
              rows={4}
              defaultValue={product?.descriptionRo}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{t.attributes}</label>
          <button
            type="button"
            onClick={addAttribute}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted"
          >
            <Plus size={13} /> {t.addAttribute}
          </button>
        </div>
        {attributes.length === 0 ? (
          <p className="text-sm text-muted">{t.noAttributes}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {attributes.map((attr, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
                <input
                  value={attr.name}
                  onChange={(e) => updateAttribute(i, "name", e.target.value)}
                  placeholder={t.attributeName}
                  className="rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
                <input
                  value={attr.nameRo}
                  onChange={(e) => updateAttribute(i, "nameRo", e.target.value)}
                  placeholder={t.attributeNameRo}
                  className="rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
                <input
                  value={attr.value}
                  onChange={(e) => updateAttribute(i, "value", e.target.value)}
                  placeholder={t.attributeValue}
                  className="rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
                <input
                  value={attr.valueRo}
                  onChange={(e) => updateAttribute(i, "valueRo", e.target.value)}
                  placeholder={t.attributeValueRo}
                  className="rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(i)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">{t.stockByStore}</label>
        {stores.length === 0 ? (
          <p className="text-sm text-muted">{t.noStores}</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <div key={store.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <span className="min-w-0 truncate text-sm text-foreground">{pick(store.name, store.nameRo, locale)}</span>
                <input
                  type="number"
                  min={0}
                  value={stockByStore[store.id] ?? 0}
                  onChange={(e) =>
                    setStockByStore((prev) => ({ ...prev, [store.id]: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  className="w-20 shrink-0 rounded-lg border border-border bg-surface px-2 py-1 text-right text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:w-fit sm:px-8"
      >
        {product ? t.saveChanges : t.submitNew}
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
  step,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  type?: string;
  step?: string;
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
        step={step}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        onChange={onChange}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
      />
    </div>
  );
}
