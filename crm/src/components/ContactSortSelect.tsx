"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CONTACT_SORT_OPTIONS, type ContactSort } from "@/lib/contactSort";

export default function ContactSortSelect({ value }: { value: ContactSort }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      value={value}
      aria-label="Sort contacts"
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", e.target.value);
        router.push(`?${params.toString()}`);
      }}
      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      {CONTACT_SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          Sort: {option.label}
        </option>
      ))}
    </select>
  );
}
