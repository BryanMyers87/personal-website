import { HEALTH_TIERS } from "@/lib/accountHealth";

export default function HealthBreakdownBar({
  counts,
  unassigned,
}: {
  counts: Record<"HEALTHY" | "AT_RISK" | "CRITICAL", number>;
  unassigned: number;
}) {
  const total = counts.HEALTHY + counts.AT_RISK + counts.CRITICAL + unassigned;

  if (total === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No won accounts yet.</p>;
  }

  const segments = [
    ...HEALTH_TIERS.map((t) => ({ key: t.value, value: counts[t.value], color: t.dot, label: t.label })),
    { key: "unassigned", value: unassigned, color: "bg-zinc-300 dark:bg-zinc-700", label: "Unassigned" },
  ].filter((s) => s.value > 0);

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {segments.map((s, i) => (
          <div
            key={s.key}
            className={s.color}
            style={{ width: `${(s.value / total) * 100}%`, marginLeft: i === 0 ? 0 : 2 }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
        {segments.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
            {s.label}: <span className="font-medium text-zinc-900 dark:text-zinc-100">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
