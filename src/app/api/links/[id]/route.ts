import type { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/security";
import { serializeLink } from "@/lib/serialize";
import { updateLinkSchema } from "@/lib/validation";

export const runtime = "nodejs";

function isRecordNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = updateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  try {
    const link = await prisma.shortLink.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
    });
    return Response.json({ link: serializeLink(link) });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return Response.json({ error: "Link not found" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.shortLink.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return Response.json({ error: "Link not found" }, { status: 404 });
    }
    throw error;
  }

  return Response.json({ ok: true });
}