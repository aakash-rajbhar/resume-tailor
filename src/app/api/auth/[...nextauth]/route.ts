import type { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { isAuthEnabled } from "@/lib/auth/feature";

export const runtime = "nodejs";

/**
 * Auth.js handlers. When the Master Profile is disabled the route does not
 * exist: no Auth.js instance is created and no session can be issued.
 */
export async function GET(req: NextRequest) {
  if (!isAuthEnabled()) {
    return new Response(null, { status: 404 });
  }
  const { handlers } = getAuth();
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  if (!isAuthEnabled()) {
    return new Response(null, { status: 404 });
  }
  const { handlers } = getAuth();
  return handlers.POST(req);
}
