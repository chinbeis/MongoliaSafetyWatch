import { defineConfig } from "drizzle-kit";
import { normalizeDatabaseUrl } from "./src/db/database-url";

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
