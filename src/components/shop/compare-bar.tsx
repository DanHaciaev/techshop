"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale, X } from "lucide-react";
import { useCompareStore } from "@/lib/compare-store";
import { useDict } from "@/i18n/locale-provider";

export function CompareBar() {
  const dict = useDict();
  const ids = useCompareStore((s) => s.ids);
  const clear = useCompareStore((s) => s.clear);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || ids.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full border border-border bg-surface px-4 py-2.5 shadow-lg">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Scale size={15} />
        </span>
        <span className="text-sm font-medium text-foreground">{dict.compare.barTitle(ids.length)}</span>
        <Link
          href="/compare"
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {dict.compare.openButton}
        </Link>
        <button
          type="button"
          aria-label={dict.compare.clearAll}
          onClick={clear}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
