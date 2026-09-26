import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ParticipationNotFoundError, deleteParticipation } from "@/lib/participation-db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }

  const { id: idParam } = await context.params;
  const id = Number(idParam);

  try {
    const result = await deleteParticipation(id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ParticipationNotFoundError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Suppression impossible.";
    let status = 500;
    if (message.includes("Identifiant invalide")) status = 400;
    else if (message.includes("Configuration D1")) status = 503;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
