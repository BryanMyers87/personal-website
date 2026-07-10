import "dotenv/config";
import { defineConfig } from "prisma/config";

// Kept in sync with src/lib/database-url.ts. Duplicated (not imported) so this
// file loads standalone under the Prisma CLI, independent of Next's module
// resolution/path aliases.
//
// Migrations specifically need the DIRECT (non-pooled) connection: a
// transaction-mode pooler like pgbouncer (what Vercel's Postgres storage
// puts in front of POSTGRES_URL / POSTGRES_PRISMA_URL) doesn't support the
// advisory lock `prisma migrate deploy` takes, which makes it hang instead
// of erroring.
function resolveMigrationDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
  ];

  const raw = candidates.find((value) => value && value.trim().length > 0);
  return raw?.trim().replace(/^['"]|['"]$/g, "");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: resolveMigrationDatabaseUrl(),
  },
});
