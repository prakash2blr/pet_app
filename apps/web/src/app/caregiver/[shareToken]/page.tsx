import { AlertTriangle, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { CheckInForm } from "@/components/CheckInForm";
import { HeaderPlanLinks } from "@/components/HeaderPlanLinks";
import { agentFetch } from "@/lib/agent";
import type { PlanContext } from "@/types";

export default async function CaregiverPage({
  params
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const context = await agentFetch<PlanContext>(`/agent/caregiver/${shareToken}`);
  const { dog, plan, tasks } = context;

  return (
    <main className="min-h-screen bg-[#f7faf6] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <AppHeader
          href="/"
          rightSlot={<HeaderPlanLinks planId={plan._id} shareToken={plan.shareToken} showCaregiver={false} />}
        />
        <div className="mt-5 rounded-lg border border-emerald-100 bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-leaf">Caregiver Checklist</p>
          <h1 className="mt-1 text-3xl font-black text-ink">{dog.name}</h1>
          <p className="mt-2 text-slate-600">{plan.caregiverInstructions}</p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Contact icon={<Phone size={16} />} label="Vet" value={`${dog.vet?.name || ""} ${dog.vet?.phone || ""}`.trim()} />
            <Contact
              icon={<Phone size={16} />}
              label="Emergency"
              value={`${dog.emergencyContact?.name || ""} ${dog.emergencyContact?.phone || ""}`.trim()}
            />
          </div>
        </div>

        {plan.criticalWarnings?.length ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={17} />
              Critical Warnings
            </div>
            <ul className="mt-2 space-y-1">
              {plan.criticalWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          {tasks.map((task) => (
            <CheckInForm key={task._id} task={task} />
          ))}
        </div>

        <Link
          className="focus-ring safe-area fixed inset-x-4 bottom-4 mx-auto inline-flex max-w-md items-center justify-center gap-2 rounded-lg bg-clay px-4 py-3 text-sm font-semibold text-white shadow-soft"
          href={`/emergency/${plan._id}`}
        >
          <AlertTriangle size={17} />
          Emergency Mode
        </Link>
      </div>
    </main>
  );
}

function Contact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="flex items-center gap-2 font-semibold text-ink">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-slate-600">{value || "not provided"}</p>
    </div>
  );
}
