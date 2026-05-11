import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  _db = drizzle(process.env.DATABASE_URL!, { schema });
  return _db;
}

export type DB = ReturnType<typeof getDb>;
