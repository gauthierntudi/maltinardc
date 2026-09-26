import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function loadEnv() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env optional if vars are already exported
  }
}

function loadMigrationStatements() {
  const dir = join(process.cwd(), "migrations");
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const statements = [];
  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    statements.push(
      ...sql
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean),
    );
  }
  return statements;
}

loadEnv();

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID?.trim();

if (!accountId || !apiToken || !databaseId) {
  console.error("Variables manquantes dans .env : CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_D1_DATABASE_ID");
  process.exit(1);
}

for (const statement of loadMigrationStatements()) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql: `${statement};` }),
    },
  );

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    console.error("Migration échouée :", payload.errors ?? payload);
    process.exit(1);
  }
  console.log("OK:", statement.split("\n")[0]);
}

console.log("Migration D1 terminée.");
