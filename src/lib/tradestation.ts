const AUTH_URL = "https://signin.tradestation.com/authorize";
const TOKEN_URL = "https://signin.tradestation.com/oauth/token";
const API_BASE = "https://api.tradestation.com/v3";

export const TRADESTATION_SCOPE = "openid offline_access ReadAccount";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export function buildAuthorizeUrl(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TRADESTATION_CLIENT_ID!,
    redirect_uri: redirectUri,
    audience: "https://api.tradestation.com",
    scope: TRADESTATION_SCOPE,
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.TRADESTATION_CLIENT_ID!,
      client_secret: process.env.TRADESTATION_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    throw new Error(`TradeStation token exchange failed: ${await res.text()}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.TRADESTATION_CLIENT_ID!,
      client_secret: process.env.TRADESTATION_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    throw new Error(`TradeStation token refresh failed: ${await res.text()}`);
  }
  return (await res.json()) as TokenResponse;
}

async function tsGet(path: string, accessToken: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`TradeStation API error (${path}): ${await res.text()}`);
  }
  return res.json();
}

// Field names follow TradeStation's documented v3 brokerage API (PascalCase).
// Verify against a real response once a connection is live — Anything unexpected
// falls back gracefully in the UI rather than throwing.

export interface TsAccount {
  AccountID: string;
  AccountType?: string;
  [key: string]: unknown;
}

export interface TsBalance {
  AccountID: string;
  Equity?: string | number;
  CashBalance?: string | number;
  MarketValue?: string | number;
  TodaysProfitLoss?: string | number;
  [key: string]: unknown;
}

export interface TsPosition {
  Symbol: string;
  Quantity?: string | number;
  AveragePrice?: string | number;
  MarketValue?: string | number;
  Last?: string | number;
  UnrealizedProfitLoss?: string | number;
  [key: string]: unknown;
}

export async function getAccounts(accessToken: string) {
  const data = await tsGet("/brokerage/accounts", accessToken);
  return (data.Accounts ?? data ?? []) as TsAccount[];
}

export async function getBalances(accessToken: string, accountIds: string) {
  const data = await tsGet(
    `/brokerage/accounts/${accountIds}/balances`,
    accessToken,
  );
  return (data.Balances ?? []) as TsBalance[];
}

export async function getPositions(accessToken: string, accountIds: string) {
  const data = await tsGet(
    `/brokerage/accounts/${accountIds}/positions`,
    accessToken,
  );
  return (data.Positions ?? []) as TsPosition[];
}
