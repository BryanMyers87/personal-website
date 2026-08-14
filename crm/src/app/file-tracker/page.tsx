import { Folder } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import OnboardingFileRow from "@/components/OnboardingFileRow";

// Reflects live checkbox/delete state; never serve a stale build snapshot.
export const dynamic = "force-dynamic";

export default async function FileTrackerPage() {
  const files = await prisma.onboardingFile.findMany({
    include: {
      company: { select: { id: true, name: true } },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  type FileWithCompany = (typeof files)[number];
  type CompanyFolder = { key: string; name: string; open: FileWithCompany[]; complete: FileWithCompany[] };

  const folders = new Map<string, CompanyFolder>();
  for (const file of files) {
    const key = file.company.id;
    const folder = folders.get(key) ?? { key, name: file.company.name, open: [], complete: [] };
    (file.completedAt ? folder.complete : folder.open).push(file);
    folders.set(key, folder);
  }

  const sortedFolders = Array.from(folders.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <PageHeader
        title="File Tracker"
        description="The first 5 files for each new client, organized into folders by company."
      />

      {sortedFolders.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No files tracked yet. Add up to 5 from a company&apos;s page once they reach Negotiation.
        </p>
      ) : (
        <div className="space-y-8">
          {sortedFolders.map((folder) => (
            <div key={folder.key}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <Folder size={15} />
                {folder.name}
              </h2>

              {folder.open.length > 0 && (
                <div className="mb-3 space-y-2">
                  {folder.open.map((file) => (
                    <OnboardingFileRow
                      key={file.id}
                      companyId={file.companyId}
                      file={file}
                      companyLink={{
                        href: `/companies/${file.company.id}`,
                        name: file.company.name,
                      }}
                    />
                  ))}
                </div>
              )}

              {folder.complete.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Complete ({folder.complete.length})
                  </p>
                  <div className="space-y-2">
                    {folder.complete.map((file) => (
                      <OnboardingFileRow
                        key={file.id}
                        companyId={file.companyId}
                        file={file}
                        companyLink={{
                          href: `/companies/${file.company.id}`,
                          name: file.company.name,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
