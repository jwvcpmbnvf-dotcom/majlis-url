import type { NextRequest } from "next/server";

export function isSameOrigin(request: NextRequest): boolean {
  const isJson =
    (request.headers.get("content-type") ?? "")
      .toLowerCase()
      .startsWith("application/json");

  if (!isJson) return false;

  const origin = request.headers.get("origin");
  if (origin) {
    const expected = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    return origin === expected;
  }

  const secFetchSite = request.headers.get("sec-fetch-site");
  if (
    secFetchSite &&
    secFetchSite !== "same-origin" &&
    secFetchSite !== "none"
  ) {
    return false;
  }

  return true;
}