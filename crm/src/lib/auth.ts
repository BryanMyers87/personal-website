import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "crm_session";
const SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 days

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET environment variable is not set.");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createSessionToken(): { value: string; maxAge: number } {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  const signature = sign(payload);
  return { value: `${payload}.${signature}`, maxAge: SESSION_MAX_AGE_SECONDS };
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  if (!timingSafeStringEqual(sign(payload), signature)) return false;
  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

export function isCorrectPassword(submitted: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new Error("APP_PASSWORD environment variable is not set.");
  return timingSafeStringEqual(submitted, expected);
}
