import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const SECRET = process.env.AUTH_SECRET ?? "dev-only-insecure-secret";

function sign(value: string) {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

function buildToken(username: string, expires: number) {
  const payload = `${username}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined) {
  if (!token) return null;
  const [username, expiresStr, signature] = token.split(".");
  if (!username || !expiresStr || !signature) return null;
  const payload = `${username}.${expiresStr}`;
  if (sign(payload) !== signature) return null;
  const expires = Number(expiresStr);
  if (Number.isNaN(expires) || Date.now() > expires) return null;
  return { username };
}

export async function verifyCredentials(username: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { username } });
  if (!user) return false;
  return bcrypt.compare(password, user.password);
}

export async function createAdminSession(username: string) {
  const expires = Date.now() + SESSION_TTL_MS;
  const token = buildToken(username, expires);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expires),
    path: "/",
  });
}

/**
 * Full current admin/seller row (role + storeId), re-read from the DB on
 * every call so a role change takes effect on the next request without
 * needing a fresh login. The session cookie only ever carries the username.
 */
export async function getCurrentAdminUser() {
  const session = await getAdminSession();
  if (!session) return null;
  return prisma.adminUser.findUnique({ where: { username: session.username } });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifyToken(token);
}
