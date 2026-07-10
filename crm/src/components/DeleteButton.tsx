"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";

export default function DeleteButton({
  action,
  confirmText,
  label = "Delete",
}: {
  action: () => Promise<void>;
  confirmText: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        startTransition(async () => {
          try {
            await action();
          } catch (err) {
            // `redirect()` inside a Server Action throws a special control-flow
            // error that must keep propagating so Next.js can navigate.
            if (err && typeof err === "object" && "digest" in err && String(err.digest).startsWith("NEXT_REDIRECT")) {
              throw err;
            }
            alert(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
    >
      <Trash2 size={14} />
      {pending ? "Deleting…" : label}
    </Button>
  );
}
