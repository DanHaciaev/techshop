"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProductGallery({
  name,
  images,
  discount,
}: {
  name: string;
  images: string[];
  discount?: number | null;
}) {
  const gallery = images.length > 0 ? images : ["/images/placeholder.svg"];
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-card border border-border bg-surface-muted">
        <Image
          src={gallery[active]}
          alt={name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        {discount ? (
          <span className="absolute left-3 top-3 rounded-full bg-danger px-3 py-1 text-sm font-bold text-white">
            -{discount}%
          </span>
        ) : null}
      </div>
      {gallery.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto overflow-y-hidden no-scrollbar">
          {gallery.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                i === active ? "border-primary" : "border-border hover:border-primary/50"
              )}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
