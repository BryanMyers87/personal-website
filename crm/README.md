# Inflate AI CRM

Contacts, company profiles, a 5-stage lead pipeline, and an analytics dashboard.

## Running it (Windows, one-time setup)

1. Go to this repository on GitHub, click the green **Code** button, then **Download ZIP**.
2. Find the downloaded ZIP file (usually in your Downloads folder), right-click it, and choose **Extract All**.
3. Open the extracted folder, then open the `crm` folder inside it.
4. Double-click **`start-crm.bat`**.
   - The first time, it will install some things automatically — this can take a few minutes. Just let it run.
   - If Windows shows a blue "Windows protected your PC" warning, click **More info**, then **Run anyway**. This happens for any downloaded script and is expected.
5. A browser window will open automatically to your CRM.

## Using it after that

Every time you want to open the CRM, just double-click **`start-crm.bat`** again in that same `crm` folder. It'll open a window titled "Inflate AI CRM" — leave that window open while you're using the CRM, and close it when you're done (or just leave it running).

Your data is saved in a file inside the `crm/prisma` folder and stays there between sessions. No leads are seeded; the pipeline starts empty.

## Local development (for developers)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
