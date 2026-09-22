import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma's own CLI (migrate/generate/seed) resolves a relative sqlite
// "file:" URL relative to schema.prisma's OWN directory (prisma/) — that's
// why DATABASE_URL="file:./dev.db" has always pointed at prisma/dev.db.
// @libsql/client has no such convention and resolves relative file: paths
// against the process's cwd instead (the project root for `next dev`),
// which would silently open/create a SEPARATE empty db at the repo root.
// Replicate Prisma's own convention here so one DATABASE_URL value works
// for both, and remote libsql:// URLs (Turso, in production) pass through
// untouched.
function resolveDatabaseUrl(raw: string): string {
  if (!raw.startsWith("file:")) return raw;
  const relative = raw.slice("file:".length);
  if (path.isAbsolute(relative)) return raw;
  return `file:${path.join(process.cwd(), "prisma", relative)}`;
}

const adapter = new PrismaLibSql({
  url: resolveDatabaseUrl(process.env.DATABASE_URL!),
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
