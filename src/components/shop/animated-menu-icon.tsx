import { cn } from "@/lib/utils";

/** Three-bar hamburger icon that morphs into an X while `open`. */
export function AnimatedMenuIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <span className={cn("relative flex h-4 w-4 shrink-0 flex-col items-center justify-center", className)}>
      <span
        className={cn(
          "absolute h-[1.5px] w-4 rounded-full bg-current transition-all duration-300 ease-out",
          open ? "translate-y-0 rotate-45" : "-translate-y-[5px] rotate-0"
        )}
      />
      <span
        className={cn(
          "absolute h-[1.5px] w-4 rounded-full bg-current transition-all duration-200 ease-out",
          open ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      />
      <span
        className={cn(
          "absolute h-[1.5px] w-4 rounded-full bg-current transition-all duration-300 ease-out",
          open ? "translate-y-0 -rotate-45" : "translate-y-[5px] rotate-0"
        )}
      />
    </span>
  );
}
