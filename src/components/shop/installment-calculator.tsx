"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { useDict } from "@/i18n/locale-provider";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const MONTH_OPTIONS = [3, 6, 12, 24];

export function InstallmentCalculator({ price }: { price: number }) {
  const dict = useDict();
  const [months, setMonths] = useState(12);
  const perMonth = Math.ceil(price / months);

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <CreditCard size={16} className="text-primary" />
        {dict.installment.title}
      </div>

      <div className="flex flex-wrap gap-2">
        {MONTH_OPTIONS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMonths(m)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              months === m
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-surface text-foreground hover:bg-surface-muted"
            )}
          >
            {dict.installment.months(m)}
          </button>
        ))}
      </div>

      <div className="mt-3 text-lg font-bold text-foreground">{dict.installment.perMonth(formatPrice(perMonth))}</div>
      <p className="mt-1 text-xs text-muted">{dict.installment.note}</p>
    </div>
  );
}
