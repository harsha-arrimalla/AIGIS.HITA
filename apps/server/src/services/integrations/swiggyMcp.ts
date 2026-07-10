/**
 * Swiggy MCP Integration — OAuth 2.1 + PKCE account linking and token store.
 *
 * Swiggy exposes its commerce platform as MCP servers (mcp.swiggy.com) secured
 * with per-user OAuth. Each Hita user links their own Swiggy account; we store
 * the tokens (Upstash Redis, in-memory fallback) and hand a fresh access token
 * to the Anthropic MCP connector on every food/dineout request.
 *
 * Flow:
 *   1. beginSwiggyAuth(userId, service)  → authorize URL (redirect the user)
 *   2. Swiggy redirects back to /integrations/swiggy/callback?code&state
 *   3. completeSwiggyAuth(state, code)   → exchanges code, stores tokens
 *   4. getSwiggyToken(userId, service)   → valid access token (auto-refresh)
 */

import { createHash, randomBytes } from "node:crypto";
import { cacheGet, cacheSet, cacheDel } from "../../lib/redis.js";

export const SWIGGY_SERVERS = {
  food: "https://mcp.swiggy.com/food",
  dineout: "https://mcp.swiggy.com/dineout",
} as const;

export type SwiggyService = keyof typeof SWIGGY_SERVERS;

const FETCH_TIMEOUT_MS = 10_000;
const PENDING_TTL_S = 600; // 10 min to complete the OAuth dance
const TOKEN_TTL_S = 60 * 60 * 24 * 60; // keep linked accounts for 60 days

// -------------------------------------------------------------------------- //
//                    IN-MEMORY FALLBACK (when Redis is absent)                 //
// -------------------------------------------------------------------------- //

const memStore = new Map<string, { value: unknown; expiresAt: number }>();

async function storeGet<T>(key: string): Promise<T | null> {
  const fromRedis = await cacheGet<T>(key);
  if (fromRedis !== null) return fromRedis;
  const entry = memStore.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    memStore.delete(key);
    return null;
  }
  return entry.value as T;
}

async function storeSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  memStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  await cacheSet(key, value, ttlSeconds);
}

async function storeDel(key: string): Promise<void> {
  memStore.delete(key);
  await cacheDel(key);
}

// -------------------------------------------------------------------------- //
//                        OAUTH SERVER DISCOVERY                                //
// -------------------------------------------------------------------------- //

interface AuthServerMeta {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
}

const metaCache = new Map<string, AuthServerMeta>();

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * MCP authorization discovery: protected-resource metadata on the MCP server
 * → authorization server metadata. Falls back to origin-default endpoints.
 */
async function discoverAuthServer(serverUrl: string): Promise<AuthServerMeta> {
  const cached = metaCache.get(serverUrl);
  if (cached) return cached;

  const { origin, pathname } = new URL(serverUrl);

  let issuer = origin;
  const prm =
    (await fetchJson(`${origin}/.well-known/oauth-protected-resource${pathname}`)) ||
    (await fetchJson(`${origin}/.well-known/oauth-protected-resource`));
  const authServers = prm?.authorization_servers as string[] | undefined;
  if (authServers?.length) issuer = authServers[0].replace(/\/$/, "");

  const asMeta =
    (await fetchJson(`${issuer}/.well-known/oauth-authorization-server`)) ||
    (await fetchJson(`${issuer}/.well-known/openid-configuration`));

  const meta: AuthServerMeta = {
    issuer,
    authorization_endpoint: (asMeta?.authorization_endpoint as string) || `${issuer}/authorize`,
    token_endpoint: (asMeta?.token_endpoint as string) || `${issuer}/token`,
    registration_endpoint: asMeta?.registration_endpoint as string | undefined,
  };
  metaCache.set(serverUrl, meta);
  return meta;
}

// -------------------------------------------------------------------------- //
//                     DYNAMIC CLIENT REGISTRATION                              //
// -------------------------------------------------------------------------- //

async function getClientId(meta: AuthServerMeta, redirectUri: string): Promise<string> {
  if (process.env.SWIGGY_OAUTH_CLIENT_ID) return process.env.SWIGGY_OAUTH_CLIENT_ID;

  const cacheKey = `swiggy:oauth:client:${meta.issuer}`;
  const cached = await storeGet<string>(cacheKey);
  if (cached) return cached;

  if (!meta.registration_endpoint) {
    throw new Error(
      "Swiggy OAuth: no registration endpoint and SWIGGY_OAUTH_CLIENT_ID not set — register a client at mcp.swiggy.com/builders"
    );
  }

  const res = await fetch(meta.registration_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_name: "Hita — AI travel guardian",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Swiggy OAuth client registration failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { client_id: string };
  await storeSet(cacheKey, data.client_id, TOKEN_TTL_S);
  return data.client_id;
}

// -------------------------------------------------------------------------- //
//                            AUTH FLOW                                         //
// -------------------------------------------------------------------------- //

interface PendingAuth {
  userId: string;
  service: SwiggyService;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
}

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms; 0 = unknown/no expiry reported
}

const tokenKey = (userId: string, service: SwiggyService) => `swiggy:tokens:${userId}:${service}`;

export async function beginSwiggyAuth(
  userId: string,
  service: SwiggyService,
  redirectUri: string
): Promise<string> {
  const serverUrl = SWIGGY_SERVERS[service];
  const meta = await discoverAuthServer(serverUrl);
  const clientId = await getClientId(meta, redirectUri);

  const state = randomBytes(24).toString("base64url");
  const codeVerifier = randomBytes(48).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

  const pending: PendingAuth = { userId, service, codeVerifier, redirectUri, clientId };
  await storeSet(`swiggy:oauth:pending:${state}`, pending, PENDING_TTL_S);

  const url = new URL(meta.authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("resource", serverUrl);
  return url.toString();
}

export async function completeSwiggyAuth(
  state: string,
  code: string
): Promise<{ userId: string; service: SwiggyService }> {
  const pending = await storeGet<PendingAuth>(`swiggy:oauth:pending:${state}`);
  if (!pending) throw new Error("Swiggy OAuth: unknown or expired state");
  await storeDel(`swiggy:oauth:pending:${state}`);

  const serverUrl = SWIGGY_SERVERS[pending.service];
  const meta = await discoverAuthServer(serverUrl);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: pending.redirectUri,
    client_id: pending.clientId,
    code_verifier: pending.codeVerifier,
    resource: serverUrl,
  });

  const tokens = await tokenRequest(meta.token_endpoint, body);
  await storeSet(tokenKey(pending.userId, pending.service), tokens, TOKEN_TTL_S);
  return { userId: pending.userId, service: pending.service };
}

async function tokenRequest(endpoint: string, body: URLSearchParams): Promise<StoredTokens> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Swiggy OAuth token request failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : 0,
  };
}

/**
 * Returns a valid access token for the user/service, refreshing if needed.
 * Null when the user hasn't linked this Swiggy service.
 */
export async function getSwiggyToken(
  userId: string,
  service: SwiggyService
): Promise<string | null> {
  const stored = await storeGet<StoredTokens>(tokenKey(userId, service));
  if (!stored) return null;

  const stillValid = stored.expiresAt === 0 || stored.expiresAt - Date.now() > 60_000;
  if (stillValid) return stored.accessToken;

  if (!stored.refreshToken) {
    await storeDel(tokenKey(userId, service));
    return null;
  }

  try {
    const serverUrl = SWIGGY_SERVERS[service];
    const meta = await discoverAuthServer(serverUrl);
    const pendingClientId =
      process.env.SWIGGY_OAUTH_CLIENT_ID ||
      (await storeGet<string>(`swiggy:oauth:client:${meta.issuer}`)) ||
      "";
    const refreshed = await tokenRequest(
      meta.token_endpoint,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: stored.refreshToken,
        client_id: pendingClientId,
        resource: serverUrl,
      })
    );
    // Some servers rotate refresh tokens; keep the old one if none returned
    if (!refreshed.refreshToken) refreshed.refreshToken = stored.refreshToken;
    await storeSet(tokenKey(userId, service), refreshed, TOKEN_TTL_S);
    return refreshed.accessToken;
  } catch (err) {
    console.error(`[swiggyMcp] Token refresh failed for ${userId}/${service}:`, err);
    await storeDel(tokenKey(userId, service));
    return null;
  }
}

export async function getSwiggyStatus(
  userId: string
): Promise<Record<SwiggyService, boolean>> {
  const [food, dineout] = await Promise.all([
    storeGet<StoredTokens>(tokenKey(userId, "food")),
    storeGet<StoredTokens>(tokenKey(userId, "dineout")),
  ]);
  return { food: !!food, dineout: !!dineout };
}

export async function disconnectSwiggy(userId: string): Promise<void> {
  await Promise.all([
    storeDel(tokenKey(userId, "food")),
    storeDel(tokenKey(userId, "dineout")),
  ]);
}
