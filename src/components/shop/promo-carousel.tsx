"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Promotion } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useDict, useLocale } from "@/i18n/locale-provider";
import { pick } from "@/i18n/pick";

export function PromoCarousel({ promotions }: { promotions: Promotion[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: promotions.length > 1 });
  const [selected, setSelected] = useState(0);
  const dict = useDict();
  const locale = useLocale();

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || promotions.length <= 1) return;
    const id = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => clearInterval(id);
  }, [emblaApi, promotions.length]);

  if (promotions.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-card" ref={emblaRef}>
        <div className="flex">
          {promotions.map((promo) => (
            <Link
              key={promo.id}
              href={`/promo/${promo.slug}`}
              className="relative min-w-0 shrink-0 grow-0 basis-full"
            >
              <div className="relative aspect-16/6 w-full min-h-55 overflow-hidden rounded-card bg-surface-muted sm:min-h-70 md:aspect-16/5">
                <Image
                  src={promo.image || "/images/placeholder.svg"}
                  alt={pick(promo.title, promo.titleRo, locale)}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {promotions.length > 1 ? (
        <>
          <button
            aria-label={dict.carousel.prevSlide}
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            aria-label={dict.carousel.nextSlide}
            onClick={scrollNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {promotions.map((p, i) => (
              <button
                key={p.id}
                aria-label={dict.carousel.slide(i + 1)}
                onClick={() => emblaApi?.scrollTo(i)}
                className={cn(
                  "h-1.5 rounded-full bg-white/60 transition-all",
                  i === selected ? "w-6 bg-white" : "w-1.5"
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
