"use client";

import { useState, useTransition } from "react";
import { createOnboardingFile } from "@/actions/onboardingFiles";
import { Button } from "@/components/ui";
import OnboardingFileRow, { type OnboardingFileData } from "@/components/OnboardingFileRow";

const MAX_FILES = 5;

export default function OnboardingFileList({ contactId, files }: { contactId: string; files: OnboardingFileData[] }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  const atLimit = files.length >= MAX_FILES;

  function handleAdd() {
    const trimmedLabel = label.trim();
    const trimmedUrl = url.trim();
    if (!trimmedLabel || !trimmedUrl) return;
    setLabel("");
    setUrl("");
    startTransition(() => {
      createOnboardingFile(contactId, trimmedLabel, trimmedUrl);
    });
  }

  return (
    <div>
      {!atLimit && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Client name / file number"
            className="w-full flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            placeholder="https://…"
            className="w-full flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <Button type="button" disabled={isPending || !label.trim() || !url.trim()} onClick={handleAdd}>
            Add
          </Button>
        </div>
      )}

      {files.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No files tracked yet — add up to 5.</p>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <OnboardingFileRow key={file.id} file={file} contactId={contactId} />
          ))}
        </div>
      )}

      <p className="mt-2 text-xs text-zinc-400">
        {files.length} / {MAX_FILES} tracked
      </p>
    </div>
  );
}
