"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useDict, useLocale } from "@/i18n/locale-provider";
import { ReviewStars } from "@/components/shop/review-stars";

type ReviewT = { id: string; author: string; rating: number; text: string; createdAt: Date | string };

function SubmitButton() {
  const { pending } = useFormStatus();
  const dict = useDict();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      {dict.reviews.submit}
    </button>
  );
}

export function ProductReviews({
  reviews,
  onSubmit,
}: {
  reviews: ReviewT[];
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const dict = useDict();
  const locale = useLocale();
  const [rating, setRating] = useState(5);
  const formRef = useRef<HTMLFormElement>(null);
  const avg = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  async function handleSubmit(formData: FormData) {
    await onSubmit(formData);
    formRef.current?.reset();
    setRating(5);
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      <div className="flex-1">
        {reviews.length > 0 ? (
          <div className="mb-6 flex items-center gap-3">
            <ReviewStars value={Math.round(avg)} />
            <span className="text-sm text-muted">
              {dict.reviews.average(avg.toFixed(1))} · {dict.reviews.count(reviews.length)}
            </span>
          </div>
        ) : null}

        {reviews.length === 0 ? (
          <p className="text-muted">{dict.reviews.empty}</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {reviews.map((r) => (
              <div key={r.id} className="py-4 first:pt-0">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">{r.author}</span>
                  <span className="text-xs text-muted">
                    {new Date(r.createdAt).toLocaleDateString(locale === "ro" ? "ro-RO" : "ru-RU")}
                  </span>
                </div>
                <ReviewStars value={r.rating} size={14} />
                {r.text ? <p className="mt-2 text-sm leading-relaxed text-muted">{r.text}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        ref={formRef}
        action={handleSubmit}
        className="flex w-full flex-col gap-3 rounded-card border border-border bg-surface p-4 lg:w-80 lg:shrink-0"
      >
        <h3 className="font-semibold text-foreground">{dict.reviews.formTitle}</h3>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{dict.reviews.formName}</label>
          <input
            name="author"
            required
            minLength={2}
            maxLength={60}
            placeholder={dict.reviews.formNamePlaceholder}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{dict.reviews.formRating}</label>
          <input type="hidden" name="rating" value={rating} />
          <ReviewStars value={rating} onChange={setRating} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{dict.reviews.formText}</label>
          <textarea
            name="text"
            rows={3}
            maxLength={2000}
            placeholder={dict.reviews.formTextPlaceholder}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}
