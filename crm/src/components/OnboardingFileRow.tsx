"use client";

import { useTransition } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { ExternalLink, Trash2 } from "lucide-react";
import { toggleOnboardingFile, deleteOnboardingFile } from "@/actions/onboardingFiles";
import { Card } from "@/components/ui";

export type OnboardingFileData = {
  id: string;
  label: string;
  url: string;
  completedAt: Date | string | null;
};

export default function OnboardingFileRow({
  file,
  contactId,
  contactLink,
}: {
  file: OnboardingFileData;
  contactId: string;
  contactLink?: { href: string; name: string };
}) {
  const [isPending, startTransition] = useTransition();
  const done = !!file.completedAt;

  return (
    <Card className={clsx("flex items-center gap-3 p-3", done && "opacity-60")}>
      <input
        type="checkbox"
        checked={done}
        disabled={isPending}
        onChange={(e) => startTransition(() => toggleOnboardingFile(file.id, contactId, e.target.checked))}
      />
      <div className="min-w-0 flex-1">
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className={clsx(
            "flex items-center gap-1 truncate text-sm font-medium hover:underline",
            done && "text-zinc-500 line-through dark:text-zinc-400",
          )}
        >
          <span className="truncate">{file.label}</span>
          <ExternalLink size={11} className="shrink-0 text-zinc-400" />
        </a>
        {contactLink && (
          <Link href={contactLink.href} className="text-xs text-zinc-400 hover:underline">
            {contactLink.name}
          </Link>
        )}
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(`Remove "${file.label}"?`)) return;
          startTransition(() => deleteOnboardingFile(file.id, contactId));
        }}
        aria-label="Remove file"
        className="shrink-0 text-zinc-400 transition-colors hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>
    </Card>
  );
}
