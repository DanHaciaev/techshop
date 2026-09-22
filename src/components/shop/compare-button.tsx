"use client";

import { useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { toast } from "sonner";
import { useCompareStore } from "@/lib/compare-store";
import { useDict } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function CompareButton({ productId, className }: { productId: string; className?: string }) {
  const dict = useDict();
  const ids = useCompareStore((s) => s.ids);
  const toggle = useCompareStore((s) => s.toggle);
  const isFull = useCompareStore((s) => s.isFull);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = mounted && ids.includes(productId);

  function handleClick() {
    if (!active && isFull(productId)) {
      toast(dict.compare.maxReached);
      return;
    }
    toggle(productId);
    if (!active) toast.success(dict.compare.added);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? dict.compare.remove : dict.compare.add}
      title={active ? dict.compare.remove : dict.compare.add}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground",
        className
      )}
    >
      <Scale size={15} />
    </button>
  );
}
