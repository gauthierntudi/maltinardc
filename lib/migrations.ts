import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function loadMigrationStatements() {
  const dir = join(process.cwd(), "migrations");
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const statements: string[] = [];
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
