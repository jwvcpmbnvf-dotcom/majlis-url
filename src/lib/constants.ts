export const SESSION_COOKIE_NAME = "url_shortener_session";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export const SESSION_SECRET_MIN_LENGTH = 32;

export const MAX_SLUG_LENGTH = 64;

export const SLUG_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const RESERVED_SLUGS = new Set([
  "admin",
  "login",
  "logout",
  "api",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.webmanifest",
  "public",
  "proxy",
  "middleware",
  "health",
  "settings",
]);

export const LOGIN_RATE_LIMIT_MAX = 5;
export const LOGIN_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

export const AUTO_SLUG_MAX_RETRIES = 12;