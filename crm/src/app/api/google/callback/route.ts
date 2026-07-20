import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, fetchGoogleEmail, saveConnection } from "@/lib/googleCalendar";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/settings?error=missing_code`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code, origin);
    if (!tokens.refresh_token) {
      // Google only issues a refresh_token when consent is actually granted
      // (we always request prompt=consent, so this shouldn't normally
      // happen) — bail rather than silently storing a connection that can't
      // refresh its access token later.
      return NextResponse.redirect(`${origin}/settings?error=no_refresh_token`);
    }
    const email = await fetchGoogleEmail(tokens.access_token);
    await saveConnection(tokens.refresh_token, email);
    return NextResponse.redirect(`${origin}/settings?connected=1`);
  } catch (err) {
    console.error("Google OAuth callback failed", err);
    return NextResponse.redirect(`${origin}/settings?error=oauth_failed`);
  }
}
