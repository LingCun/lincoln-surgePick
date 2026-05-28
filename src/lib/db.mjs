import { createClient } from '@libsql/client';

let cached;
export function getDb() {
  if (cached) return cached;
  const url = import.meta.env.TURSO_DATABASE_URL;
  const authToken = import.meta.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL not set in Astro env');
  cached = createClient({ url, authToken });
  return cached;
}
