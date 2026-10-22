import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple per-instance in-memory rate limiter. In a multi-instance/serverless
// deployment this is best-effort; replace with a shared store (Redis/Upstash)
// for strict enforcement.
const buckets = new Map<string, { count: number; reset: number }>();

const WINDOW_MS = 60_000;
const LIMITS: Record<string, number> = {
  "/api": 60,
  "/auth": 30,
};

function limitFor(pathname: string): number | null {
  for (const prefix of Object.keys(LIMITS)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return LIMITS[prefix];
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const limit = limitFor(request.nextUrl.pathname);
  if (limit === null) return NextResponse.next();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const key = `${ip}:${request.nextUrl.pathname.split("/").slice(0, 3).join("/")}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.reset) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return NextResponse.next();
  }

  if (bucket.count >= limit) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((bucket.reset - now) / 1000)),
      },
    });
  }

  bucket.count += 1;
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/auth/:path*"],
};