import { NextResponse } from "next/server";
import { isAuthEnabled } from "@/lib/auth/feature";

export const runtime = "nodejs";

/** Tells the client whether sign-in is available on this deployment. */
export async function GET() {
  return NextResponse.json({ enabled: isAuthEnabled() });
}
