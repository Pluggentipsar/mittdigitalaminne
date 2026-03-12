import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createSupabaseClient } from "./db/supabase.js";
import { createServer } from "./server.js";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MCP_AUTH_TOKEN: string;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-session-id, mcp-protocol-version",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

// ── Stateless crypto helpers (HMAC-SHA256) ──

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createSignedToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const data = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const sig = await hmacSign(data, secret);
  return `${data}.${sig}`;
}

async function verifySignedToken(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = await hmacSign(data, secret);
  if (sig !== expectedSig) return null;
  try {
    const json = JSON.parse(atob(data.replace(/-/g, "+").replace(/_/g, "/")));
    if (json.exp && Date.now() > json.exp) return null;
    return json;
  } catch {
    return null;
  }
}

// ── OAuth + MCP Worker ──

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // ── OAuth Authorization Server Metadata (RFC 8414) ──
    if (path === "/.well-known/oauth-authorization-server") {
      const baseUrl = `${url.protocol}//${url.host}`;
      return jsonResponse({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/authorize`,
        token_endpoint: `${baseUrl}/token`,
        registration_endpoint: `${baseUrl}/register`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
        code_challenge_methods_supported: ["S256"],
        scopes_supported: ["mcp"],
      });
    }

    // ── Protected Resource Metadata (RFC 9728) ──
    if (path === "/.well-known/oauth-protected-resource") {
      const baseUrl = `${url.protocol}//${url.host}`;
      return jsonResponse({
        resource: `${baseUrl}/mcp`,
        authorization_servers: [baseUrl],
        scopes_supported: ["mcp"],
      });
    }

    // ── Dynamic Client Registration (RFC 7591) ──
    if (path === "/register" && request.method === "POST") {
      try {
        const body = await request.json() as Record<string, unknown>;
        const clientId = crypto.randomUUID();
        const clientSecret = await createSignedToken(
          { client_id: clientId, type: "client_secret", exp: Date.now() + 365 * 24 * 60 * 60 * 1000 },
          env.MCP_AUTH_TOKEN
        );
        return jsonResponse({
          client_id: clientId,
          client_secret: clientSecret,
          client_secret_expires_at: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
          redirect_uris: body.redirect_uris || [],
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["code"],
          token_endpoint_auth_method: body.token_endpoint_auth_method || "client_secret_post",
        }, 201);
      } catch {
        return jsonResponse({ error: "invalid_request" }, 400);
      }
    }

    // ── Authorization Endpoint ──
    if (path === "/authorize" && request.method === "GET") {
      const clientId = url.searchParams.get("client_id");
      const redirectUri = url.searchParams.get("redirect_uri");
      const state = url.searchParams.get("state");
      const codeChallenge = url.searchParams.get("code_challenge");
      const codeChallengeMethod = url.searchParams.get("code_challenge_method");

      if (!clientId || !redirectUri || !codeChallenge) {
        return jsonResponse({ error: "invalid_request", error_description: "Missing required parameters" }, 400);
      }

      // Create signed authorization code (stateless — all data in the token)
      const code = await createSignedToken({
        client_id: clientId,
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod || "S256",
        type: "auth_code",
        exp: Date.now() + 10 * 60 * 1000, // 10 min expiry
      }, env.MCP_AUTH_TOKEN);

      // Auto-approve for single-user personal app
      const redirect = new URL(redirectUri);
      redirect.searchParams.set("code", code);
      if (state) redirect.searchParams.set("state", state);

      return Response.redirect(redirect.toString(), 302);
    }

    // ── Token Endpoint ──
    if (path === "/token" && request.method === "POST") {
      let body: URLSearchParams;
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        body = new URLSearchParams(await request.text());
      } else if (contentType.includes("application/json")) {
        const json = await request.json() as Record<string, string>;
        body = new URLSearchParams(json);
      } else {
        body = new URLSearchParams(await request.text());
      }

      const grantType = body.get("grant_type");

      if (grantType === "authorization_code") {
        const code = body.get("code");
        const codeVerifier = body.get("code_verifier");
        const redirectUri = body.get("redirect_uri");

        if (!code || !codeVerifier) {
          return jsonResponse({ error: "invalid_request" }, 400);
        }

        // Verify the signed auth code
        const payload = await verifySignedToken(code, env.MCP_AUTH_TOKEN);
        if (!payload || payload.type !== "auth_code") {
          return jsonResponse({ error: "invalid_grant" }, 400);
        }

        // Verify PKCE: SHA-256(code_verifier) must match code_challenge
        const encoder = new TextEncoder();
        const digest = await crypto.subtle.digest("SHA-256", encoder.encode(codeVerifier));
        const computedChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
          .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

        if (computedChallenge !== payload.code_challenge) {
          return jsonResponse({ error: "invalid_grant", error_description: "PKCE verification failed" }, 400);
        }

        // Issue access token + refresh token
        const accessToken = await createSignedToken({
          client_id: payload.client_id,
          type: "access_token",
          scope: "mcp",
          exp: Date.now() + 60 * 60 * 1000, // 1 hour
        }, env.MCP_AUTH_TOKEN);

        const refreshToken = await createSignedToken({
          client_id: payload.client_id,
          type: "refresh_token",
          scope: "mcp",
          exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        }, env.MCP_AUTH_TOKEN);

        return jsonResponse({
          access_token: accessToken,
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: refreshToken,
          scope: "mcp",
        });
      }

      if (grantType === "refresh_token") {
        const refreshToken = body.get("refresh_token");
        if (!refreshToken) {
          return jsonResponse({ error: "invalid_request" }, 400);
        }

        const payload = await verifySignedToken(refreshToken, env.MCP_AUTH_TOKEN);
        if (!payload || payload.type !== "refresh_token") {
          return jsonResponse({ error: "invalid_grant" }, 400);
        }

        const accessToken = await createSignedToken({
          client_id: payload.client_id,
          type: "access_token",
          scope: "mcp",
          exp: Date.now() + 60 * 60 * 1000,
        }, env.MCP_AUTH_TOKEN);

        const newRefreshToken = await createSignedToken({
          client_id: payload.client_id,
          type: "refresh_token",
          scope: "mcp",
          exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
        }, env.MCP_AUTH_TOKEN);

        return jsonResponse({
          access_token: accessToken,
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: newRefreshToken,
          scope: "mcp",
        });
      }

      return jsonResponse({ error: "unsupported_grant_type" }, 400);
    }

    // ── MCP Endpoint (POST /) ──
    // Verify Bearer token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const baseUrl = `${url.protocol}//${url.host}`;
      return new Response("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`,
          ...CORS_HEADERS,
        },
      });
    }

    const token = authHeader.slice(7);
    // Accept both: signed OAuth tokens AND the raw MCP_AUTH_TOKEN (for direct testing)
    let isAuthorized = false;
    if (token === env.MCP_AUTH_TOKEN) {
      isAuthorized = true;
    } else {
      const payload = await verifySignedToken(token, env.MCP_AUTH_TOKEN);
      if (payload && payload.type === "access_token") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new Response("Invalid token", { status: 401, headers: CORS_HEADERS });
    }

    // Handle MCP request
    const supabase = createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const server = createServer(supabase);

    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    const response = await transport.handleRequest(request);

    const corsResponse = new Response(response.body, response);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      corsResponse.headers.set(key, value);
    }

    return corsResponse;
  },
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}
