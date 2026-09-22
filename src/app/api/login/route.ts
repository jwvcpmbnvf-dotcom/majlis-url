import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import {
  getAdminConfig,
  getIronSessionFromCookies,
  sessionMisconfigured,
} from "@/lib/auth";
import {
  checkLoginRateLimit,
  resetLoginRateLimit,
} from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const config = getAdminConfig();
  if (sessionMisconfigured(config)) {
    return Response.json(
      { error: "Server is not configured correctly. Please contact the administrator." },
      { status: 500 }
    );
  }

  const limited = checkLoginRateLimit(request);
  if (!limited.ok) {
    return Response.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { username, password } = parsed.data;

  const hashMatches = await bcrypt.compare(password, config.passwordHash);
  const usernameMatches = username === config.username;

  if (!hashMatches || !usernameMatches) {
    return Response.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const session = await getIronSessionFromCookies();
  session.isAdmin = true;
  session.username = username;
  await session.save();
  resetLoginRateLimit(request);

  return Response.json({ ok: true });
}