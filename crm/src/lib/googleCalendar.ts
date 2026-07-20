import { prisma } from "@/lib/prisma";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

// Single-user app: always the same connection row.
const CONNECTION_ID = "default";

// Least-privilege scopes: create/edit events (not full calendar access),
// plus email so the settings page can show which account is connected.
const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/userinfo.email"].join(
  " ",
);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getRedirectUri(origin: string): string {
  return `${origin}/api/google/callback`;
}

export function getGoogleAuthUrl(origin: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: getRedirectUri(origin),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  origin: string,
): Promise<{ access_token: string; refresh_token?: string }> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: getRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string };
  return data.email ?? null;
}

export async function saveConnection(refreshToken: string, email: string | null): Promise<void> {
  await prisma.googleCalendarConnection.upsert({
    where: { id: CONNECTION_ID },
    create: { id: CONNECTION_ID, refreshToken, email },
    update: { refreshToken, email },
  });
}

export function getConnection() {
  return prisma.googleCalendarConnection.findUnique({ where: { id: CONNECTION_ID } });
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await prisma.googleCalendarConnection.deleteMany({ where: { id: CONNECTION_ID } });
}

// Best-effort: if not connected, or the API call fails, this throws — callers
// that trigger it as a side effect of another action (like checking a touch
// point) should catch and swallow so a calendar hiccup never blocks the CRM
// action itself.
export async function createCalendarEvent(event: {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
}): Promise<void> {
  const connection = await getConnection();
  if (!connection) return;

  const accessToken = await refreshAccessToken(connection.refreshToken);

  const res = await fetch(CALENDAR_EVENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.start.toISOString() },
      end: { dateTime: event.end.toISOString() },
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create Google Calendar event: ${await res.text()}`);
  }
}
