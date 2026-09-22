"use server";

import { redirect } from "next/navigation";
import { verifyCredentials, createAdminSession, destroyAdminSession } from "@/lib/auth";
import { getDict } from "@/i18n/get-dictionary";

export type LoginState = { error?: string };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const ok = await verifyCredentials(username, password);
  if (!ok) {
    const { dict } = await getDict();
    return { error: dict.admin.login.error };
  }

  await createAdminSession(username);
  redirect("/admin-panel-secret");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin-panel-secret/login");
}
