import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import PipelineBoard from "@/components/PipelineBoard";

// The board reflects live drag-and-drop stage changes; never serve a stale
// build-time snapshot.
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const leads = await prisma.lead.findMany({
    include: {
      company: { select: { name: true } },
      contact: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Drag leads across stages as they move through your process."
        action={
          <ButtonLink href="/leads/new">
            <Plus size={16} /> New Lead
          </ButtonLink>
        }
      />

      {leads.length === 0 ? (
        <EmptyState
          title="No leads in the pipeline yet"
          description="Create your first lead to start tracking it through your stages."
          action={
            <ButtonLink href="/leads/new">
              <Plus size={16} /> New Lead
            </ButtonLink>
          }
        />
      ) : (
        <PipelineBoard leads={leads} />
      )}
    </div>
  );
}
