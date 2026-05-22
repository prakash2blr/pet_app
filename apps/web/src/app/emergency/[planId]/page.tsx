import { AppHeader } from "@/components/AppHeader";
import { EmergencyForm } from "@/components/EmergencyForm";
import { agentFetch } from "@/lib/agent";
import type { PlanContext } from "@/types";

export default async function EmergencyPage({
  params,
  searchParams
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { planId } = await params;
  const query = await searchParams;
  const context = await agentFetch<PlanContext>(`/agent/plan/${planId}`);

  return (
    <main className="min-h-screen bg-[#f7faf6] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <AppHeader href={`/owner/dashboard/${planId}`} />
        <div className="mt-5">
          <h1 className="text-3xl font-black text-ink">Emergency Mode</h1>
          <p className="mt-2 text-slate-600">
            {context.dog.name} · {context.plan.title}
          </p>
        </div>
        <div className="mt-6">
          <EmergencyForm planId={planId} initialIncidentType={query.mode === "lost" ? "lost_dog" : "vomiting_diarrhea"} />
        </div>
      </div>
    </main>
  );
}
