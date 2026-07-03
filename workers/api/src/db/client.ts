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
