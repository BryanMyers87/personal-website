// Vercel's Postgres storage integration doesn't always name its connection
// string env var `DATABASE_URL` — depending on how it was connected, it may
// show up as `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, or `POSTGRES_URL_NON_POOLING`
// instead. Rather than requiring anyone to hand-copy the value into a new
// `DATABASE_URL` variable (error-prone — stray quotes/whitespace break the
// connection string), resolve it from whichever of these is actually set.
export function resolveDatabaseUrl(): string {
  const candidates = [
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ];

  const raw = candidates.find((value) => value && value.trim().length > 0);

  if (!raw) {
    throw new Error(
      "No database connection string found. Set DATABASE_URL (or connect Vercel Postgres storage) in your environment variables.",
    );
  }

  // Strip accidental wrapping quotes from copy-pasted values.
  return raw.trim().replace(/^['"]|['"]$/g, "");
}
