import { d1Exec, d1Query } from "@/lib/d1";
import { loadMigrationStatements } from "@/lib/migrations";
import { normalizeName, normalizePhone, type Majeur } from "@/lib/participation";

export type ParticipationRow = {
  id: number;
  nom: string;
  telephone: string;
  majeur: number;
  created_at: string;
};

export class DuplicatePhoneError extends Error {
  constructor() {
    super("Ce numéro de téléphone a déjà participé.");
    this.name = "DuplicatePhoneError";
  }
}

let schemaReady: Promise<void> | null = null;

export function ensureParticipationSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const statement of loadMigrationStatements()) {
        await d1Exec(`${statement};`);
      }
    })();
  }
  return schemaReady;
}

export type CreateParticipationInput = {
  nom: string;
  telephone: string;
  majeur: Majeur;
};

async function phoneExists(telephone: string) {
  const { rows } = await d1Query<{ id: number }>(
    "SELECT id FROM participations WHERE telephone = ? LIMIT 1",
    [telephone],
  );
  return rows.length > 0;
}

export async function listParticipations(limit = 200, offset = 0) {
  await ensureParticipationSchema();
  const safeLimit = Math.min(Math.max(limit, 1), 500);
  const safeOffset = Math.max(offset, 0);

  const { rows } = await d1Query<ParticipationRow>(
    `SELECT id, nom, telephone, majeur, created_at
     FROM participations
     ORDER BY datetime(created_at) DESC, id DESC
     LIMIT ? OFFSET ?`,
    [safeLimit, safeOffset],
  );

  const { rows: countRows } = await d1Query<{ total: number }>(
    "SELECT COUNT(*) AS total FROM participations",
  );

  return {
    rows,
    total: Number(countRows[0]?.total ?? 0),
    limit: safeLimit,
    offset: safeOffset,
  };
}

export async function createParticipation(input: CreateParticipationInput) {
  await ensureParticipationSchema();

  const nom = normalizeName(input.nom);
  const telephone = normalizePhone(input.telephone);

  if (input.majeur !== "oui") {
    throw new Error("La participation est réservée aux personnes de plus de 18 ans.");
  }

  if (await phoneExists(telephone)) {
    throw new DuplicatePhoneError();
  }

  try {
    const { lastRowId } = await d1Query(
      `INSERT INTO participations (nom, telephone, majeur, created_at)
       VALUES (?, ?, 1, datetime('now'))`,
      [nom, telephone],
    );
    return { id: lastRowId, nom };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("unique") || message.toLowerCase().includes("constraint")) {
      throw new DuplicatePhoneError();
    }
    throw error;
  }
}
