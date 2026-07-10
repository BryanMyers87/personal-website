# Inflate AI CRM

Contacts, company profiles, a 5-stage lead pipeline, and an analytics dashboard, built with Next.js and Prisma/Postgres.

## Local development

Requires a Postgres database. If you don't have one, the fastest options are a free [Neon](https://neon.tech) or [Supabase](https://supabase.com) database, or `docker run -p 5432:5432 -e POSTGRES_PASSWORD=localdev postgres:16`.

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel (free)

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Sign up at [vercel.com](https://vercel.com) (GitHub login is fastest) and create a new project from this repo, setting the project's **Root Directory** to `crm`.
3. In the new project, go to **Storage → Create Database → Postgres** (free tier) and connect it to the project. This automatically sets a `DATABASE_URL` (or `POSTGRES_PRISMA_URL`/similar) environment variable — if it's not named exactly `DATABASE_URL`, add a `DATABASE_URL` env var in **Settings → Environment Variables** pointing to the same connection string.
4. Deploy. On the first deploy (or by running `npx prisma migrate deploy` locally against the same `DATABASE_URL`), apply the migrations in `prisma/migrations/` so the database schema exists.
5. Visit the URL Vercel gives you — that's the live CRM.

No leads are seeded; the pipeline starts empty.
