// Vercel's Postgres storage integration (Neon or Supabase, depending on how
// it was connected) exposes several connection-string env vars instead of a
// single `DATABASE_URL`:
//
// - `POSTGRES_PRISMA_URL` / `POSTGRES_URL` — go through a connection pooler
//   (pgbouncer). Fine, and preferred, for the app's normal runtime queries.
// - `POSTGRES_URL_NON_POOLING` — a direct connection to the database.
//   Required for running migrations: `prisma migrate deploy` takes an
//   advisory lock that a transaction-mode pooler (like pgbouncer) can't
//   support, which makes it hang indefinitely instead of erroring.
//
// `DATABASE_URL` is also checked so this still works with any other Postgres
// host (local dev, Neon/Supabase used directly, etc.) that only sets one URL.

function firstDefined(...values: (string | undefined)[]): string | undefined {
  const raw = values.find((value) => value && value.trim().length > 0);
  // Strip accidental wrapping quotes from copy-pasted values.
  return raw?.trim().replace(/^['"]|['"]$/g, "");
}

// For the app's runtime Prisma Client: prefer the pooled connection.
export function resolveRuntimeDatabaseUrl(): string {
  const url = firstDefined(
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  );
  if (!url) throw new Error("No database connection string found. Set DATABASE_URL in your environment variables.");
  return url;
}

// For `prisma migrate deploy`: prefer the direct (non-pooled) connection.
export function resolveMigrationDatabaseUrl(): string | undefined {
  return firstDefined(
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
  );
}
