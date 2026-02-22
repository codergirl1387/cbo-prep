import { createClient, type Client } from '@libsql/client';

declare global {
  // eslint-disable-next-line no-var
  var __db: Client | undefined;
  // eslint-disable-next-line no-var
  var __dbMigrated: boolean | undefined;
}

export function getDb(): Client {
  if (global.__db) return global.__db;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) throw new Error('TURSO_DATABASE_URL is not set');

  global.__db = createClient({ url, authToken });
  return global.__db;
}

/**
 * Ensures migrations have run. Safe to call multiple times (no-op after first run).
 * Called from API routes on Vercel where instrumentation.ts may not have run yet.
 */
export async function ensureMigrated(): Promise<void> {
  if (global.__dbMigrated) return;
  const { runMigrations } = await import('./migrations');
  await runMigrations();
  global.__dbMigrated = true;
}
