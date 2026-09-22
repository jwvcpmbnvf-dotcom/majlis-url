import { z } from "zod";
import { MAX_SLUG_LENGTH } from "./constants";
import { isReservedSlug } from "./slug";

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeDestinationUrl(value: string): string {
  const parsed = new URL(value);
  parsed.hash = "";
  return parsed.toString();
}

export const createLinkSchema = z.object({
  destinationUrl: z
    .string()
    .trim()
    .min(1, "Destination URL is required")
    .max(2048, "Destination URL is too long")
    .refine(isHttpUrl, "Only http:// and https:// URLs are allowed"),
  slug: z
    .string()
    .trim()
    .max(MAX_SLUG_LENGTH, `Short code is too long (max ${MAX_SLUG_LENGTH} characters)`)
    .refine(
      (value) => value === "" || /^[A-Za-z0-9_-]+$/.test(value),
      "Only letters, numbers, - and _ are allowed"
    )
    .refine((value) => value === "" || !isReservedSlug(value), "This short code is reserved")
    .optional()
    .default(""),
});

export const updateLinkSchema = z.object({
  isActive: z.boolean({ error: "isActive must be a boolean" }),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(128),
  password: z.string().min(1, "Password is required").max(512),
});