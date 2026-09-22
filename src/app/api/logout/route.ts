import type { NextRequest } from "next/server";
import { getIronSessionFromCookies } from "@/lib/auth";
import { isSameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }

  try {
    const session = await getIronSessionFromCookies();
    session.destroy();
  } catch {
    // Session cookie is already gone or invalid; logout still succeeds.
  }

  return Response.json({ ok: true });
}