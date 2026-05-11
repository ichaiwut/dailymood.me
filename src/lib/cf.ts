import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "@/db/schema";

interface D1Result {
  results: Record<string, unknown>[];
  success: boolean;
  meta: { changes: number; last_row_id: number };
}

interface D1Response {
  result: D1Result[];
  success: boolean;
  errors: { message: string }[];
}

async function d1Query(sql: string, params: unknown[], method: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID!;
  const token = process.env.CLOUDFLARE_D1_TOKEN!;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    },
  );

  const json = (await res.json()) as D1Response;

  if (!json.success) {
    throw new Error(`D1 query failed: ${json.errors?.[0]?.message ?? res.statusText}`);
  }

  const result = json.result[0];
  const rows = result.results.map((row) => Object.values(row));

  if (method === "run") {
    return { rows, lastInsertRowid: result.meta.last_row_id, changes: result.meta.changes };
  }

  return { rows };
}

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  _db = drizzle(
    async (sql, params, method) => d1Query(sql, params, method),
    { schema },
  );
  return _db;
}

export type DB = ReturnType<typeof getDb>;
