import { getDict } from "@/i18n/get-dictionary";

const COLOR_MAP: Record<string, string> = {
  NEW: "bg-primary-soft text-primary",
  CONFIRMED: "bg-primary-soft text-primary",
  PROCESSING: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  SHIPPED: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-success/15 text-success",
  CANCELED: "bg-danger/15 text-danger",
};

export async function StatusBadge({ status }: { status: string }) {
  const { dict } = await getDict();
  const labels = dict.orderStatus as Record<string, string>;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_MAP[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

export const ORDER_STATUSES = ["NEW", "CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELED"] as const;
