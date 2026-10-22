type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

const SECRET_PATTERNS: RegExp[] = [
  /AIza[0-9A-Za-z\-_]{8,}/g,
  /gsk_[0-9A-Za-z]{8,}/g,
  /Bearer\s+[A-Za-z0-9._\-]{8,}/gi,
];

const MAX_VALUE_LENGTH = 500;

function redactString(value: string): string {
  let out = value;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, "[redacted]");
  }
  if (out.length > MAX_VALUE_LENGTH) {
    out = `${out.slice(0, MAX_VALUE_LENGTH)}…[truncated]`;
  }
  return out;
}

/**
 * Strips anything that looks like a credential and truncates long values.
 * Resume content must never be logged, so callers pass identifiers only.
 */
export function redact(value: unknown): unknown {
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map(redact);
  if (value instanceof Error) return redactString(value.message);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = /key|token|secret|password|authorization/i.test(key)
        ? "[redacted]"
        : redact(val);
    }
    return out;
  }
  return String(value);
}

function emit(level: LogLevel, message: string, meta?: unknown): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;
  const payload = {
    level,
    message: redactString(message),
    ...(meta === undefined ? {} : { meta: redact(meta) }),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: unknown) => emit("debug", message, meta),
  info: (message: string, meta?: unknown) => emit("info", message, meta),
  warn: (message: string, meta?: unknown) => emit("warn", message, meta),
  error: (message: string, meta?: unknown) => emit("error", message, meta),
};
