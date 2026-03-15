import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const isExtension =
    origin.startsWith("chrome-extension://") ||
    origin.startsWith("moz-extension://");

  // Handle CORS preflight for browser extensions
  if (request.method === "OPTIONS" && isExtension) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();

  // Add CORS headers for extension requests
  if (isExtension) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
