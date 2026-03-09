import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });

function normalizeDatabaseUrl(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith("postgres")) {
    return trimmed;
  }

  const singleQuoted = trimmed.match(/psql\s+'([^']+)'/i);
  if (singleQuoted) {
    return singleQuoted[1];
  }

  const doubleQuoted = trimmed.match(/psql\s+"([^"]+)"/i);
  if (doubleQuoted) {
    return doubleQuoted[1];
  }

  const urlMatch = trimmed.match(/(postgres(?:ql)?:\/\/\S+)/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  return trimmed;
}
