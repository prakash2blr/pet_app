import { AlertTriangle, Search } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { OwnerDashboardSummary } from "@/components/OwnerDashboardSummary";
import { TaskCard } from "@/components/TaskCard";
import { agentFetch } from "@/lib/agent";
import type { PlanContext } from "@/types";

export default async function OwnerDashboardPage({
  params
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const context = await agentFetch<PlanContext>(`/agent/plan/${planId}`);

  return (
    <main className="min-h-screen bg-[#f7faf6] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <AppHeader href={`/owner/plan/${planId}`} />
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-ink">{context.plan.title}</h1>
            <p className="mt-2 text-slate-600">
              {context.dog.name} · {context.plan.startDate} to {context.plan.endDate}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-clay px-4 py-2 text-sm font-semibold text-white"
              href={`/emergency/${planId}`}
            >
              <AlertTriangle size={17} />
              Open Emergency Mode
            </Link>
            <Link
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
              href={`/emergency/${planId}?mode=lost`}
            >
              <Search size={17} />
              Lost Dog Mode
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_380px]">
          <OwnerDashboardSummary planId={planId} tasks={context.tasks} checkIns={context.checkIns} />
          <aside className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Task Status</h2>
            {context.tasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}
