"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewStars({
  value,
  onChange,
  size = 18,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(s)}
          className={cn(!onChange && "cursor-default", onChange && "cursor-pointer")}
          aria-label={String(s)}
        >
          <Star size={size} className={s <= value ? "fill-primary text-primary" : "fill-none text-border"} />
        </button>
      ))}
    </div>
  );
}
