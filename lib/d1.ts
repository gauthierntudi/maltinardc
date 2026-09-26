type D1QueryResult = {
  success: boolean;
  errors?: Array<{ message: string }>;
  result?: Array<{
    results?: unknown[];
    meta?: { changes?: number; last_row_id?: number };
  }>;
};

function getD1Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID?.trim();

  if (!accountId || !apiToken || !databaseId) {
    throw new Error(
      "Configuration D1 incomplète. Renseignez CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN et CLOUDFLARE_D1_DATABASE_ID dans .env.",
    );
  }

  return { accountId, apiToken, databaseId };
}

export async function d1Query<T = unknown>(sql: string, params: unknown[] = []) {
  const { accountId, apiToken, databaseId } = getD1Config();
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as D1QueryResult;

  if (!response.ok || !payload.success) {
    const message =
      payload.errors?.map((error) => error.message).join(" ") ||
      `Requête D1 échouée (${response.status}).`;
    throw new Error(message);
  }

  const first = payload.result?.[0];
  return {
    rows: (first?.results ?? []) as T[],
    changes: first?.meta?.changes ?? 0,
    lastRowId: first?.meta?.last_row_id ?? 0,
  };
}

export async function d1Exec(sql: string) {
  return d1Query(sql);
}
