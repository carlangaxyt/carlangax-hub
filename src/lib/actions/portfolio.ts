"use server";

import { createClient } from "@/lib/supabase/server";
import {
  refreshAccessToken,
  getAccounts,
  getBalances,
  getPositions,
  type TsBalance,
  type TsPosition,
} from "@/lib/tradestation";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, user };
}

export interface PortfolioData {
  accountId: string;
  balance: TsBalance | null;
  positions: TsPosition[];
}

export async function getPortfolio(): Promise<PortfolioData | null> {
  const { supabase, user } = await requireUser();

  const { data: connection } = await supabase
    .from("broker_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "tradestation")
    .maybeSingle();

  if (!connection) return null;

  let accessToken = connection.access_token as string;

  if (new Date(connection.expires_at) <= new Date()) {
    const refreshed = await refreshAccessToken(connection.refresh_token);
    accessToken = refreshed.access_token;
    await supabase
      .from("broker_connections")
      .update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: new Date(
          Date.now() + refreshed.expires_in * 1000,
        ).toISOString(),
      })
      .eq("id", connection.id);
  }

  let accountId = connection.account_id as string | null;
  if (!accountId) {
    const accounts = await getAccounts(accessToken);
    accountId = accounts[0]?.AccountID ?? null;
    if (accountId) {
      await supabase
        .from("broker_connections")
        .update({ account_id: accountId })
        .eq("id", connection.id);
    }
  }

  if (!accountId) return null;

  const [balances, positions] = await Promise.all([
    getBalances(accessToken, accountId),
    getPositions(accessToken, accountId),
  ]);

  return {
    accountId,
    balance: balances[0] ?? null,
    positions,
  };
}

export async function disconnectBroker() {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("broker_connections")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "tradestation");
  if (error) throw new Error(error.message);
}
