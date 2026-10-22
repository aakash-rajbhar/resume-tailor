import { NextResponse } from "next/server";
import { HttpError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/** Maps an error to an API response. Known errors keep their status code. */
export function apiErrorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  logger.error("request failed", {
    message,
    name: err instanceof Error ? err.name : "unknown",
  });
  return NextResponse.json({ error: message }, { status: 500 });
}
