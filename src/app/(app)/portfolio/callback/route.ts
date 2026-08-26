import { NextResponse, type NextRequest } from "next/server";
import { exchangeCodeForToken } from "@/lib/tradestation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get("ts_oauth_state")?.value;

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(`${origin}/portfolio?error=invalid_state`);
  }

  try {
    const redirectUri = `${origin}/portfolio/callback`;
    const token = await exchangeCodeForToken(code, redirectUri);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    await supabase.from("broker_connections").upsert(
      {
        user_id: user.id,
        provider: "tradestation",
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
      },
      { onConflict: "user_id,provider" },
    );

    const response = NextResponse.redirect(`${origin}/portfolio`);
    response.cookies.delete("ts_oauth_state");
    return response;
  } catch {
    return NextResponse.redirect(`${origin}/portfolio?error=connect_failed`);
  }
}
