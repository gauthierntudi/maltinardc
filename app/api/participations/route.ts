import { NextResponse } from "next/server";
import { createParticipation, DuplicatePhoneError } from "@/lib/participation-db";
import { validateAge, validateName, validatePhone, type Majeur } from "@/lib/participation";
import { sendParticipationSuccessSms } from "@/lib/unikron-sms";

export const runtime = "nodejs";

type Body = {
  nom?: string;
  telephone?: string;
  majeur?: Majeur;
};

export async function POST(request: Request) {
  let body: Body;

  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Corps de requête invalide." }, { status: 400 });
  }

  const nom = body.nom ?? "";
  const telephone = body.telephone ?? "";
  const majeur = body.majeur ?? "";

  const errors = {
    nom: validateName(nom),
    telephone: validatePhone(telephone),
    age: validateAge(majeur),
  };

  const firstError =
    errors.nom ? { field: "nom", message: errors.nom } :
    errors.telephone ? { field: "telephone", message: errors.telephone } :
    errors.age ? { field: "age", message: errors.age } :
    null;

  if (firstError) {
    return NextResponse.json({ ok: false, ...firstError }, { status: 400 });
  }

  try {
    const saved = await createParticipation({ nom, telephone, majeur });

    try {
      await sendParticipationSuccessSms({ nom: saved.nom, telephone });
    } catch (error) {
      console.error(
        "[unikron] SMS de confirmation non envoye:",
        error instanceof Error ? error.message : error,
      );
    }

    return NextResponse.json({ ok: true, id: saved.id, nom: saved.nom });
  } catch (error) {
    if (error instanceof DuplicatePhoneError) {
      return NextResponse.json(
        { ok: false, field: "telephone", error: error.message },
        { status: 409 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Impossible d'enregistrer la participation.";
    const status = message.includes("Configuration D1") ? 503 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
