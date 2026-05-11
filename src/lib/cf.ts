import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "@/db/schema";

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
      body: JSON.stringify({ sql, params: params.map((p) => (p === undefined ? null : p)) }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 HTTP ${res.status}: ${text}`);
  }

  const json = await res.json() as {
    success: boolean;
    errors?: { message: string }[];
    result?: {
      results?: Record<string, unknown>[];
      success?: boolean;
      meta?: { changes: number; last_row_id: number; rows_read: number; rows_written: number };
    }[];
  };

  if (!json.success || !json.result?.length) {
    throw new Error(`D1 error: ${json.errors?.[0]?.message ?? JSON.stringify(json)}`);
  }

  const d1result = json.result[0];
  const rows = (d1result.results ?? []).map((row) => Object.values(row));

  if (method === "run") {
    return {
      rows,
      lastInsertRowid: d1result.meta?.last_row_id ?? 0,
      changes: d1result.meta?.changes ?? 0,
    };
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
