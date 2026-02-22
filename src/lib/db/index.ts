import { createClient, type Client } from '@libsql/client';

declare global {
  // eslint-disable-next-line no-var
  var __db: Client | undefined;
}

export function getDb(): Client {
  if (global.__db) return global.__db;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) throw new Error('TURSO_DATABASE_URL is not set');

  global.__db = createClient({ url, authToken });
  return global.__db;
}
