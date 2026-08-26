import { NextResponse, type NextRequest } from "next/server";
import { buildAuthorizeUrl } from "@/lib/tradestation";

export async function GET(request: NextRequest) {
  const redirectUri = `${request.nextUrl.origin}/portfolio/callback`;
  const state = crypto.randomUUID();

  const response = NextResponse.redirect(
    buildAuthorizeUrl(redirectUri, state),
  );
  response.cookies.set("ts_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
