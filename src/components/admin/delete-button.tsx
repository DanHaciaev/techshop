"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  action,
  confirmText = "Удалить запись?",
}: {
  action: () => Promise<void>;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      title="Удалить"
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        startTransition(() => {
          action();
        });
      }}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
    >
      <Trash2 size={15} />
    </button>
  );
}
