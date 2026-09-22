import type { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { AUTO_SLUG_MAX_RETRIES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/security";
import { serializeLink } from "@/lib/serialize";
import { buildShortUrl } from "@/lib/short-url";
import {
  findAvailableSlug,
  isUniqueConstraintViolation,
} from "@/lib/slug";
import { createLinkSchema, normalizeDestinationUrl } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await prisma.shortLink.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ links: links.map(serializeLink) });
}

export async function POST(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const requestedSlug = parsed.data.slug.trim();
  const destinationUrl = normalizeDestinationUrl(parsed.data.destinationUrl);
  const isAuto = !requestedSlug;

  let slug = requestedSlug || (await findAvailableSlug());

  for (let attempt = 0; attempt <= AUTO_SLUG_MAX_RETRIES; attempt += 1) {
    try {
      const link = await prisma.shortLink.create({
        data: { slug, destinationUrl },
      });
      return Response.json(
        { link: serializeLink(link), shortUrl: buildShortUrl(request, link.slug) },
        { status: 201 }
      );
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }
      if (!isAuto) {
        return Response.json(
          { error: "This short code is already taken" },
          { status: 409 }
        );
      }
      slug = await findAvailableSlug();
    }
  }

  return Response.json(
    { error: "Could not generate a unique short code. Please try again." },
    { status: 500 }
  );
}