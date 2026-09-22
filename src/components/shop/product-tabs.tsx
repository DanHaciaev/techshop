"use client";

import { useState } from "react";
import { L } from "@/i18n/l";
import { useDict } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { ProductReviews } from "@/components/shop/product-reviews";

type Attribute = { name: string; nameRo?: string; value: string; valueRo?: string };
type ReviewT = { id: string; author: string; rating: number; text: string; createdAt: Date | string };

export function ProductTabs({
  descriptionRu,
  descriptionRo,
  attributes,
  reviews,
  onSubmitReview,
}: {
  descriptionRu: string;
  descriptionRo: string;
  attributes: Attribute[];
  reviews: ReviewT[];
  onSubmitReview: (formData: FormData) => Promise<void>;
}) {
  const dict = useDict();
  const [tab, setTab] = useState<"description" | "specs" | "reviews">("description");

  const tabs = [
    { key: "description" as const, label: dict.product.tabDescription },
    { key: "specs" as const, label: dict.product.tabSpecifications },
    { key: "reviews" as const, label: `${dict.product.tabReviews} (${reviews.length})` },
  ];

  return (
    <div className="mt-10 border-t border-border pt-6">
      <div className="mb-6 flex gap-1 overflow-x-auto overflow-y-hidden no-scrollbar border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "description" ? (
        <div className="max-w-3xl leading-relaxed text-muted">
          {descriptionRu ? <L ru={descriptionRu} ro={descriptionRo} /> : dict.product.noDescription}
        </div>
      ) : null}

      {tab === "specs" ? (
        attributes.length > 0 ? (
          <dl className="flex max-w-2xl flex-col divide-y divide-border text-sm">
            {attributes.map((attr, i) => (
              <div key={i} className="flex justify-between gap-4 py-2.5">
                <dt className="text-muted">
                  <L ru={attr.name} ro={attr.nameRo || attr.name} />
                </dt>
                <dd className="text-right font-medium text-foreground">
                  <L ru={attr.value} ro={attr.valueRo || attr.value} />
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-muted">{dict.product.noSpecifications}</p>
        )
      ) : null}

      {tab === "reviews" ? <ProductReviews reviews={reviews} onSubmit={onSubmitReview} /> : null}
    </div>
  );
}
