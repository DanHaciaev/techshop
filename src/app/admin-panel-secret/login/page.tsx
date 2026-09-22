"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { useDict } from "@/i18n/locale-provider";
import { LocaleSwitcher } from "@/i18n/locale-switcher";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const dict = useDict();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-8">
        <div className="mb-4 flex justify-end">
          <LocaleSwitcher />
        </div>
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <LockKeyhole size={22} />
          </span>
          <h1 className="mt-3 text-xl font-bold text-foreground">{dict.admin.login.title}</h1>
          <p className="mt-1 text-sm text-muted">{dict.admin.login.subtitle}</p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-foreground">
              {dict.admin.login.username}
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              defaultValue="admin"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              {dict.admin.login.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              defaultValue="admin"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>

          {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? dict.admin.login.submitting : dict.admin.login.submit}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted">{dict.admin.login.defaultsHint}</p>
      </div>
    </div>
  );
}
