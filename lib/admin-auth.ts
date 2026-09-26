import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const adminCookieName = "maltina_admin_session";

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) {
    throw new Error("ADMIN_PASSWORD manquant dans .env.");
  }
  return password;
}

export function createAdminSessionToken() {
  return createHmac("sha256", getAdminPassword()).update("maltina-admin-v1").digest("hex");
}

export function verifyPassword(candidate: string) {
  const expected = getAdminPassword();
  if (candidate.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}

export function verifyAdminSessionToken(token: string | undefined) {
  if (!token) return false;
  try {
    const expected = createAdminSessionToken();
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return verifyAdminSessionToken(store.get(adminCookieName)?.value);
}

export function adminCookieOptions(maxAgeSeconds = 60 * 60 * 12) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
