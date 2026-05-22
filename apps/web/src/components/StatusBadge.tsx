import type { TaskStatus } from "@/types";

const styles: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  done: "bg-mint text-leaf border-emerald-200",
  skipped: "bg-amber-100 text-amber-800 border-amber-200",
  issue: "bg-red-100 text-red-800 border-red-200",
  critical: "bg-clay text-white border-clay",
  normal: "bg-mint text-leaf border-emerald-200",
  watch: "bg-honey/40 text-amber-900 border-honey",
  urgent: "bg-red-600 text-white border-red-600"
};

export function StatusBadge({ value }: { value: TaskStatus | string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[value] || styles.pending}`}>
      {value.replace("_", " ")}
    </span>
  );
}
