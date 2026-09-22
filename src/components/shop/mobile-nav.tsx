"use client";

import { useState } from "react";
import Link from "next/link";
import { X, ChevronDown } from "lucide-react";
import type { CategoryTreeNode } from "@/lib/data";
import { useDict } from "@/i18n/locale-provider";
import { L } from "@/i18n/l";
import { AnimatedMenuIcon } from "@/components/shop/animated-menu-icon";
import { cn } from "@/lib/utils";

export function MobileNav({ tree }: { tree: CategoryTreeNode[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const dict = useDict();

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? dict.mobileNav.close : dict.mobileNav.open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground"
      >
        <AnimatedMenuIcon open={open} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setOpen(false)} />
          <div
            className={cn(
              "relative flex h-dvh w-72 max-w-[80vw] flex-col gap-1 overflow-y-auto bg-surface p-4 shadow-xl",
              "animate-drawer-in"
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-muted">{dict.mobileNav.catalogHeading}</span>
              <button
                type="button"
                aria-label={dict.mobileNav.close}
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-muted"
              >
                <X size={18} />
              </button>
            </div>
            {tree.map((c) => {
              const isExpanded = expanded === c.id;
              return (
                <div key={c.id}>
                  <div className="flex items-center">
                    <Link
                      href={`/catalog/${c.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-muted"
                    >
                      <L ru={c.name} ro={c.nameRo} />
                    </Link>
                    {c.children.length > 0 ? (
                      <button
                        type="button"
                        aria-label={c.name}
                        onClick={() => setExpanded(isExpanded ? null : c.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-muted"
                      >
                        <ChevronDown size={16} className={cn("transition-transform", isExpanded ? "rotate-180" : "")} />
                      </button>
                    ) : null}
                  </div>
                  {c.children.length > 0 && isExpanded ? (
                    <div className="ml-3 flex flex-col border-l border-border pl-3">
                      {c.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/catalog/${child.slug}`}
                          onClick={() => setOpen(false)}
                          className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-muted hover:text-foreground"
                        >
                          <L ru={child.name} ro={child.nameRo} />
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
