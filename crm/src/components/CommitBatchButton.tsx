"use client";

import { useTransition } from "react";
import { commitLeadBatch } from "@/actions/leadUpload";
import { Button } from "@/components/ui";

export default function CommitBatchButton({ batchId, disabled }: { batchId: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await commitLeadBatch(batchId);
          } catch (err) {
            if (err && typeof err === "object" && "digest" in err && String(err.digest).startsWith("NEXT_REDIRECT")) {
              throw err;
            }
            alert(err instanceof Error ? err.message : "Something went wrong.");
          }
        })
      }
    >
      {pending ? "Committing…" : "Commit"}
    </Button>
  );
}
