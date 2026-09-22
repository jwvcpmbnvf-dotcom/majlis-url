import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import {
  SESSION_COOKIE_NAME,
  SESSION_SECRET_MIN_LENGTH,
  SESSION_TTL_SECONDS,
} from "./constants";

export interface SessionData {
  isAdmin?: boolean;
  username?: string;
}

export interface AdminConfig {
  username: string;
  passwordHash: string;
  sessionSecret: string;
}

export function getAdminConfig(): AdminConfig {
  return {
    username: process.env.ADMIN_USERNAME ?? "",
    passwordHash: process.env.ADMIN_PASSWORD_HASH ?? "",
    sessionSecret: process.env.SESSION_SECRET ?? "",
  };
}

export function sessionMisconfigured(config: AdminConfig): boolean {
  return (
    config.username.length === 0 ||
    config.passwordHash.length === 0 ||
    config.sessionSecret.length < SESSION_SECRET_MIN_LENGTH
  );
}

export async function getIronSessionFromCookies() {
  const cookieStore = await cookies();
  const config = getAdminConfig();
  if (sessionMisconfigured(config)) {
    throw new Error("Server is not configured correctly");
  }
  return getIronSession<SessionData>(cookieStore, {
    cookieName: SESSION_COOKIE_NAME,
    password: config.sessionSecret,
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  });
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getIronSessionFromCookies();
    return session.isAdmin === true;
  } catch {
    return false;
  }
}