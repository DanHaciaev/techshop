"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = {
  label: React.ReactNode;
  indeterminate?: boolean;
  className?: string;
  name?: string;
  value?: string;
} & (
  | { checked: boolean; onChange: (checked: boolean) => void; defaultChecked?: never }
  | { checked?: undefined; onChange?: (checked: boolean) => void; defaultChecked?: boolean }
);

/**
 * Works both as a controlled input (pass `checked`+`onChange`, for client
 * filter state) and as a plain uncontrolled form field (pass `name` +
 * `defaultChecked`, for native <form action={serverAction}> submissions —
 * the real checkbox input is still in the DOM, just visually replaced).
 */
export function Checkbox({ checked, onChange, defaultChecked, label, indeterminate, className, name, value }: CheckboxProps) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(defaultChecked ?? false);
  const isChecked = isControlled ? checked : internal;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e.target.checked);
  }

  return (
    <label className={cn("group flex cursor-pointer select-none items-center gap-2.5 text-sm text-foreground", className)}>
      <span className="relative inline-flex h-4.5 w-4.5 shrink-0">
        <input
          type="checkbox"
          name={name}
          value={value}
          checked={isControlled ? checked : undefined}
          defaultChecked={!isControlled ? defaultChecked : undefined}
          onChange={handleChange}
          ref={(el) => {
            if (el) el.indeterminate = !!indeterminate && !isChecked;
          }}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          className={cn(
            "pointer-events-none flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-colors",
            isChecked || indeterminate
              ? "border-primary bg-primary"
              : "border-border bg-surface group-hover:border-primary/60",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40"
          )}
        >
          {isChecked ? <Check size={13} strokeWidth={3.2} className="text-primary-foreground" /> : null}
          {!isChecked && indeterminate ? <span className="h-0.5 w-2.5 rounded-full bg-primary-foreground" /> : null}
        </span>
      </span>
      <span className="leading-tight">{label}</span>
    </label>
  );
}
