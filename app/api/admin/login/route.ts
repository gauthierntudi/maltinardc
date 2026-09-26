import { NextResponse } from "next/server";
import {
  adminCookieName,
  adminCookieOptions,
  createAdminSessionToken,
  verifyPassword,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

type Body = { password?: string };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  const password = body.password ?? "";
  if (!password) {
    return NextResponse.json({ ok: false, error: "Mot de passe requis." }, { status: 400 });
  }

  try {
    if (!verifyPassword(password)) {
      return NextResponse.json({ ok: false, error: "Mot de passe incorrect." }, { status: 401 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Configuration admin invalide.";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, createAdminSessionToken(), adminCookieOptions());
  return response;
}
