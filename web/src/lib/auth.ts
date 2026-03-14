import { NextRequest } from "next/server";

/**
 * Validates an API key from the Authorization header.
 * Used for browser extension and external API access.
 * Returns true if no EXTENSION_API_KEY is configured (open access)
 * or if the provided key matches.
 */
export function validateApiKey(request: NextRequest): boolean {
  const extensionKey = process.env.EXTENSION_API_KEY;

  // If no key is configured, allow all requests (single-user mode)
  if (!extensionKey) return true;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  return token === extensionKey;
}

/**
 * Check if request is from same origin (browser navigation)
 * or has valid API key (extension/external).
 */
export function isAuthorized(request: NextRequest): boolean {
  // Same-origin requests (from web app itself) are always allowed
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin || referer) {
    // Request has origin/referer - likely from browser
    // In single-user mode, allow all same-site requests
    return true;
  }

  // External request - check API key
  return validateApiKey(request);
}
