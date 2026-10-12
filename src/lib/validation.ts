const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// VINs are 17 characters and never contain I, O or Q.
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
const ZIP_RE = /^\d{5}$/;
const MAX_MAKE_LENGTH = 40;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isValidVin(value: string): boolean {
  return VIN_RE.test(value);
}

export function isValidZip(value: string): boolean {
  return ZIP_RE.test(value);
}

/**
 * Parses a model year from a query string or request body.
 * Returns null when the value is missing, non-numeric, or outside the range
 * of vehicles this app prices (1950 through next year).
 */
export function parseModelYear(value: unknown, now: Date = new Date()): number | null {
  const str = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!/^\d{4}$/.test(str)) return null;
  const year = Number(str);
  const max = now.getFullYear() + 1;
  return year >= 1950 && year <= max ? year : null;
}

/**
 * Accepts a make name such as "Toyota" or "Mercedes-Benz". Letters, digits,
 * spaces, hyphens and ampersands only, so the value is safe to place in
 * an outbound URL path segment.
 */
export function parseMakeName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_MAKE_LENGTH) return null;
  return /^[A-Za-z0-9][A-Za-z0-9 &-]*$/.test(trimmed) ? trimmed : null;
}

/** Parses a JSON request body, returning null instead of throwing on malformed input. */
export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
