import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { getServerEnv } from "@/lib/env";
import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

let instance: Database | null = null;

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not set");
    this.name = "DatabaseNotConfiguredError";
  }
}

/**
 * Lazily constructs the Drizzle client on first use, so importing this module
 * never throws — `next build` and CI work without a DATABASE_URL.
 */
export function getDb(): Database {
  if (instance) {
    return instance;
  }

  const { databaseUrl } = getServerEnv();
  if (!databaseUrl) {
    throw new DatabaseNotConfiguredError();
  }

  instance = drizzle(neon(databaseUrl), { schema });
  return instance;
}
