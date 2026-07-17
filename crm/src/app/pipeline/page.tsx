import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import PipelineBoard from "@/components/PipelineBoard";

// The board reflects live drag-and-drop stage changes; never serve a stale
// build-time snapshot.
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  // Won deals move to Relationship Management (a stage outside STAGE_ORDER,
  // so they already fall out of the board's columns). Lost deals are
  // excluded here explicitly so they land in the Holding Tank instead.
  const deals = await prisma.contact.findMany({
    where: { status: { not: "LOST" } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      stage: true,
      estimatedValue: true,
      company: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Drag contacts across stages as their deals move through your process."
        action={
          <ButtonLink href="/contacts/new">
            <Plus size={16} /> New Contact
          </ButtonLink>
        }
      />

      {deals.length === 0 ? (
        <EmptyState
          title="No deals in the pipeline yet"
          description="Add your first contact to start tracking it through your stages."
          action={
            <ButtonLink href="/contacts/new">
              <Plus size={16} /> New Contact
            </ButtonLink>
          }
        />
      ) : (
        <PipelineBoard deals={deals} />
      )}
    </div>
  );
}
