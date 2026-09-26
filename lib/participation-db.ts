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

export class ParticipationNotFoundError extends Error {
  constructor() {
    super("Participation introuvable.");
    this.name = "ParticipationNotFoundError";
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

export type ListParticipationsOptions = {
  limit?: number;
  offset?: number;
  search?: string;
};

export async function listParticipations(options: ListParticipationsOptions = {}) {
  await ensureParticipationSchema();

  const safeLimit = Math.min(Math.max(options.limit ?? 20, 1), 500);
  const safeOffset = Math.max(options.offset ?? 0, 0);
  const search = options.search?.trim() ?? "";

  let whereClause = "";
  let filterParams: unknown[] = [];

  if (search) {
    const phoneDigits = search.replace(/\D/g, "");
    if (phoneDigits.length >= 2) {
      whereClause = "WHERE LOWER(nom) LIKE LOWER(?) OR telephone LIKE ?";
      filterParams = [`%${search}%`, `%${phoneDigits}%`];
    } else {
      whereClause = "WHERE LOWER(nom) LIKE LOWER(?)";
      filterParams = [`%${search}%`];
    }
  }

  const { rows } = await d1Query<ParticipationRow>(
    `SELECT id, nom, telephone, majeur, created_at
     FROM participations
     ${whereClause}
     ORDER BY datetime(created_at) DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...filterParams, safeLimit, safeOffset],
  );

  const { rows: countRows } = await d1Query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM participations ${whereClause}`,
    filterParams,
  );

  const { rows: allCountRows } = await d1Query<{ total: number }>(
    "SELECT COUNT(*) AS total FROM participations",
  );

  return {
    rows,
    total: Number(countRows[0]?.total ?? 0),
    totalAll: Number(allCountRows[0]?.total ?? 0),
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

export async function deleteParticipation(id: number) {
  await ensureParticipationSchema();

  const safeId = Math.floor(id);
  if (!Number.isFinite(safeId) || safeId <= 0) {
    throw new Error("Identifiant invalide.");
  }

  const { changes } = await d1Query("DELETE FROM participations WHERE id = ?", [safeId]);
  if (changes === 0) {
    throw new ParticipationNotFoundError();
  }

  return { id: safeId };
}
