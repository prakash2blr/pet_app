import { ArrowRight, ShieldCheck, Stethoscope, Workflow } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DemoButtons } from "@/components/DemoButtons";
import { DemoQuickLinks } from "@/components/DemoQuickLinks";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7faf6]">
      <section className="hero-photo relative flex min-h-[82vh] items-end">
        <div className="absolute inset-x-0 top-0 z-10">
          <div className="mx-auto w-full max-w-6xl px-5 pt-4 sm:px-8">
            <AppHeader variant="dark" rightSlot={<DemoQuickLinks variant="dark" />} />
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-5 pb-10 pt-20 sm:px-8 lg:pb-16">
          <div className="max-w-3xl text-white">
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">
              AI Dog Care Handover That Actually Gets Followed
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/90">
              Create care plans, share caregiver checklists, verify check-ins, and prepare emergency summaries.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-leaf px-5 py-3 font-semibold text-white"
                href="/owner/new"
              >
                Create Care Plan
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="mt-4">
              <DemoButtons />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-8 sm:px-8 md:grid-cols-3">
        <Feature icon={<Workflow size={22} />} title="Agentic Workflow" body="The ADK agent plans, stores, retrieves, summarizes, and logs care runs." />
        <Feature icon={<ShieldCheck size={22} />} title="Verified Check-ins" body="Caregiver submissions include task status, timestamp, severity, notes, and optional proof." />
        <Feature icon={<Stethoscope size={22} />} title="Emergency Ready" body="The agent prepares concise vet summaries without medical diagnosis." />
      </section>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-mint text-leaf">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </article>
  );
}
