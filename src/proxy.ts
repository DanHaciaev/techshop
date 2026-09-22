import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Fast, edge-safe presence check. The real HMAC signature/expiry check
// happens in the Node.js runtime inside src/app/admin-panel-secret/(dashboard)/layout.tsx.
export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has("admin_session");
  if (!hasSession) {
    const url = new URL("/admin-panel-secret/login", req.url);
    return NextResponse.redirect(url);
  }
  // The dashboard layout (Node runtime, already DB-backed) needs to know the
  // current path to redirect a seller-role user away from admin-only pages —
  // Server Component layouts have no other way to read it. Just plain
  // request metadata, no signature/trust implications, so it's fine to set
  // at the edge.
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin-panel-secret/((?!login).*)"],
};
