import { ExternalLink, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { GeneratedPlanCard } from "@/components/GeneratedPlanCard";
import { HeaderPlanLinks } from "@/components/HeaderPlanLinks";
import { agentFetch } from "@/lib/agent";
import type { PlanContext } from "@/types";

export default async function OwnerPlanPage({
  params
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const context = await agentFetch<PlanContext>(`/agent/plan/${planId}`);
  const caregiverUrl = context.caregiverUrl || "";

  return (
    <main className="min-h-screen bg-[#f7faf6] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <AppHeader
          href="/"
          rightSlot={<HeaderPlanLinks planId={context.plan._id} shareToken={context.plan.shareToken} showPlanReview={false} />}
        />
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
          <GeneratedPlanCard context={context} />
          <aside className="space-y-3 lg:sticky lg:top-5 lg:self-start">
            <div className="rounded-lg border border-emerald-100 bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Caregiver Link</h2>
              <p className="mt-2 break-all text-sm text-slate-600">{caregiverUrl}</p>
              <div className="mt-4 space-y-3">
                <CopyLinkButton value={caregiverUrl} />
                <Link
                  className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2 text-sm font-semibold text-white"
                  href={`/caregiver/${context.plan.shareToken}`}
                >
                  <ExternalLink size={17} />
                  Open Caregiver View
                </Link>
                <Link
                  className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink"
                  href={`/owner/dashboard/${context.plan._id}`}
                >
                  <LayoutDashboard size={17} />
                  Open Owner Dashboard
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
