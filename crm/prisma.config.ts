import "dotenv/config";
import { defineConfig } from "prisma/config";

// Kept in sync with src/lib/database-url.ts. Duplicated (not imported) so this
// file loads standalone under the Prisma CLI, independent of Next's module
// resolution/path aliases.
function resolveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL_NON_POOLING,
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
    url: resolveDatabaseUrl(),
  },
});
