import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * v1 draait op één hardcoded user; het schema is multi-user-ready (user_id +
 * FK op elke tabel). Deze constante vervalt in de auth-fase (later), waar userId
 * uit de sessie komt.
 */
export const CURRENT_USER_ID = 1;

export function makeDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Db = ReturnType<typeof makeDb>;

/**
 * Idempotently ensure the single v1 user row (CURRENT_USER_ID) exists. The schema
 * is multi-user-ready (FK user_id on every table) but no route ever inserts into
 * `users`, so a freshly-migrated D1 has no row to FK against — the first mutating
 * write would orphan its rows. INSERT OR IGNORE (onConflictDoNothing) makes this a
 * no-op once the row exists; only `id` is required (all other columns nullable).
 */
export async function ensureUser(db: Db, userId: number): Promise<void> {
  await db.insert(schema.users).values({ id: userId }).onConflictDoNothing();
}
