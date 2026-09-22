import type { NextRequest } from "next/server";

export function getHost(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    return forwardedHost.split(",")[0]?.trim() || request.nextUrl.host;
  }
  return request.nextUrl.host;
}

export function getProtocol(request: NextRequest): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() || "https";
  }
  return request.nextUrl.protocol.replace(":", "");
}

export function buildShortUrl(request: NextRequest, slug: string): string {
  return `${getProtocol(request)}://${getHost(request)}/${slug}`;
}