import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listParticipations } from "@/lib/participation-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "200");
  const offset = Number(searchParams.get("offset") ?? "0");

  try {
    const data = await listParticipations(limit, offset);
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de charger les participations.";
    const status = message.includes("Configuration D1") || message.includes("ADMIN_PASSWORD") ? 503 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
