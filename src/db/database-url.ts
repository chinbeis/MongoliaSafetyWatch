/**
 * Accepts the formats people actually paste into DATABASE_URL — a bare
 * postgres:// URL, or the `psql '…'` command Neon's console copies — and
 * returns the plain connection string. Shared by the runtime client and
 * drizzle.config.ts so the two never disagree.
 */
export function normalizeDatabaseUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

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
