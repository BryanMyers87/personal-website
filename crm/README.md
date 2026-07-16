# Inflate AI CRM

Contacts, company profiles, a 5-stage lead pipeline, and an analytics dashboard.

## Live app

Hosted on Railway with a Postgres database. No leads are seeded; the pipeline starts empty.

## Local development

Requires a Postgres database (e.g. `railway run`, a local Postgres install, or Docker).

```bash
cp .env.example .env   # then set DATABASE_URL to your Postgres connection string
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying

The `build` script runs `prisma migrate deploy` before `next build`, so deploying just means:

1. Provision a Postgres database and set `DATABASE_URL` in the app's environment variables.
2. Deploy — migrations run automatically as part of the build.
