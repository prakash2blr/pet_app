import type { PlanContext } from "@/types";
import { TaskCard } from "./TaskCard";

export function GeneratedPlanCard({ context }: { context: PlanContext }) {
  const { dog, plan, tasks } = context;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-emerald-100 bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-leaf">{dog.name}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{plan.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {plan.startDate} to {plan.endDate}
          {plan.caregiverName ? ` · caregiver: ${plan.caregiverName}` : ""}
        </p>
        <p className="mt-4 text-base leading-7 text-slate-700">{plan.aiGeneratedSummary}</p>
      </div>

      {plan.criticalWarnings?.length ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-900">Critical Warnings</h2>
          <ul className="mt-2 space-y-1 text-sm text-red-800">
            {plan.criticalWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan.missingInfo?.length ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-950">Missing Info</h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {plan.missingInfo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Caregiver Instructions</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">{plan.caregiverInstructions}</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Generated Tasks</h2>
        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} />
        ))}
      </div>
    </section>
  );
}
