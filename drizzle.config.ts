import { defineConfig } from "drizzle-kit";

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
