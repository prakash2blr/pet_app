import { Clock, ShieldCheck } from "lucide-react";
import type { CareTask } from "@/types";
import { StatusBadge } from "./StatusBadge";

export function TaskCard({ task }: { task: CareTask }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink">{task.title}</h3>
          {task.description ? <p className="mt-1 text-sm text-slate-600">{task.description}</p> : null}
        </div>
        <StatusBadge value={task.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        {task.dueTime ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
            <Clock size={13} />
            {task.dueTime}
          </span>
        ) : null}
        <span className="rounded-full bg-skyglass px-2 py-1">{task.type}</span>
        {task.critical ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-red-700">
            <ShieldCheck size={13} />
            critical
          </span>
        ) : null}
      </div>
    </article>
  );
}
