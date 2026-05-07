import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

interface Env {
  DB: D1Database;
}

function env(): Env {
  return getRequestContext().env as unknown as Env;
}

export function getDb() {
  return drizzle(env().DB, { schema });
}

export type DB = ReturnType<typeof getDb>;
