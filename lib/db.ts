import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

// SSL automatico para provedores gerenciados (Neon, Supabase, etc.)
const needsSsl =
  process.env.DATABASE_SSL === "true" ||
  /neon\.tech|supabase|render\.com|amazonaws/.test(connectionString || "");

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export const pool =
  global._pgPool ||
  new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") global._pgPool = pool;

export async function q<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}
