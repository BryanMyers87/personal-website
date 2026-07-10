# Inflate AI CRM

Contacts, company profiles, a 5-stage lead pipeline, and an analytics dashboard, built with Next.js and Prisma/Postgres.

## Deploying (no terminal required)

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New… → Project**, then import the `BryanMyers87/personal-website` GitHub repo.
3. On the setup screen, expand **Root Directory** and set it to `crm`. Click **Deploy**. (This first deploy will fail — that's expected, there's no database yet. Continue to the next step.)
4. Open the new project, go to the **Storage** tab, click **Create Database**, choose **Postgres** (free tier), and connect it to the project.
5. Go to the **Deployments** tab, click the **⋯** menu on the most recent deployment, and choose **Redeploy**.
6. When it finishes, click the URL Vercel shows you — that's your live CRM.

Database tables are created automatically as part of every deploy, so there's nothing else to run. No leads are seeded; the pipeline starts empty.

## Local development (optional, for developers)

Requires a local Postgres database.

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
