import Link from "next/link";
import {
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Refrigerator,
  Gamepad2,
  Cable,
  Package,
} from "lucide-react";
import type { CategoryTreeNode } from "@/lib/data";
import { L } from "@/i18n/l";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  smartphones: Smartphone,
  laptops: Laptop,
  tv: Tv,
  audio: Headphones,
  appliances: Refrigerator,
  gaming: Gamepad2,
  accessories: Cable,
};

export function CategoryTiles({ tree }: { tree: CategoryTreeNode[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
      {tree.map((c) => {
        const Icon = ICONS[c.slug] ?? Package;
        return (
          <Link
            key={c.id}
            href={`/catalog/${c.slug}`}
            className="group flex flex-col items-center gap-2 rounded-card border border-border bg-surface p-4 text-center transition-colors hover:border-primary hover:bg-primary-soft"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon size={22} />
            </span>
            <span className="text-xs font-medium text-foreground sm:text-sm">
              <L ru={c.name} ro={c.nameRo} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
