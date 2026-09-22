import { RESERVED_SLUGS, SLUG_ALPHABET } from "./constants";
import { prisma } from "./prisma";

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug) || slug.startsWith("_");
}

export function encodeSlugFromIndex(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    let remainder = n % 62;
    n = Math.floor(n / 62);
    if (remainder === 0) {
      remainder = 62;
      n -= 1;
    }
    out = SLUG_ALPHABET[remainder - 1] + out;
  }
  return out;
}

export async function findAvailableSlug(): Promise<string> {
  const rows = await prisma.shortLink.findMany({
    select: { slug: true },
  });
  const used = new Set(rows.map((row) => row.slug));

  let index = 0;
  while (true) {
    const candidate = encodeSlugFromIndex(index);
    if (!used.has(candidate) && !isReservedSlug(candidate)) {
      return candidate;
    }
    index += 1;
  }
}

export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}