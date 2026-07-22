import { Folder } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import OnboardingFileRow from "@/components/OnboardingFileRow";

// Reflects live checkbox/delete state; never serve a stale build snapshot.
export const dynamic = "force-dynamic";

export default async function FileTrackerPage() {
  const files = await prisma.onboardingFile.findMany({
    include: {
      contact: {
        select: { id: true, firstName: true, lastName: true, company: { select: { id: true, name: true } } },
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  type FileWithContact = (typeof files)[number];
  type CompanyFolder = { key: string; name: string; open: FileWithContact[]; complete: FileWithContact[] };

  const folders = new Map<string, CompanyFolder>();
  for (const file of files) {
    const company = file.contact.company;
    const key = company?.id ?? "no-company";
    const name = company?.name ?? "No Company";
    const folder = folders.get(key) ?? { key, name, open: [], complete: [] };
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
          No files tracked yet. Add up to 5 from a contact&apos;s page once they reach Negotiation.
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
                      contactId={file.contactId}
                      file={file}
                      contactLink={{
                        href: `/contacts/${file.contact.id}`,
                        name: `${file.contact.firstName} ${file.contact.lastName}`,
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
                        contactId={file.contactId}
                        file={file}
                        contactLink={{
                          href: `/contacts/${file.contact.id}`,
                          name: `${file.contact.firstName} ${file.contact.lastName}`,
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
