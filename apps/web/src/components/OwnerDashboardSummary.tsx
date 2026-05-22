"use client";

import { AlertTriangle, ClipboardList, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { CareTask, CheckIn } from "@/types";
import { StatusBadge } from "./StatusBadge";

type Summary = {
  summary: string;
  completedTasks: string[];
  missedOrSkippedTasks: string[];
  issues: string[];
  ownerAttentionNeeded: boolean;
  nextRecommendedAction: string;
};

const checkInDateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata"
});

export function OwnerDashboardSummary({
  planId,
  tasks,
  checkIns
}: {
  planId: string;
  tasks: CareTask[];
  checkIns: CheckIn[];
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const counts = tasks.reduce(
    (acc, task) => {
      acc[task.status] += 1;
      return acc;
    },
    { pending: 0, done: 0, skipped: 0, issue: 0 } as Record<CareTask["status"], number>
  );

  async function generate() {
    setLoading(true);
    const response = await fetch("/api/agent/daily-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId })
    });
    const data = await response.json();
    setSummary(data.summary);
    setLoading(false);
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(counts).map(([status, count]) => (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={status}>
            <StatusBadge value={status} />
            <p className="mt-3 text-3xl font-bold text-ink">{count}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <ClipboardList size={19} />
              Latest Check-ins
            </h2>
            <p className="mt-1 text-sm text-slate-600">{checkIns.length} verified submission(s)</p>
          </div>
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2 text-sm font-semibold text-white"
            disabled={loading}
            onClick={generate}
            type="button"
          >
            <RefreshCw size={17} />
            {loading ? "Generating" : "Generate Daily Summary"}
          </button>
        </div>

        {checkIns.length ? (
          <div className="mt-4 space-y-3">
            {checkIns.slice(-5).map((checkIn) => (
              <div className="rounded-lg bg-slate-50 p-3 text-sm" key={checkIn._id}>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={checkIn.status} />
                  <StatusBadge value={checkIn.severity} />
                  <span className="text-slate-500">
                    {checkInDateFormatter.format(new Date(checkIn.createdAt))}
                  </span>
                </div>
                {checkIn.note ? <p className="mt-2 text-slate-700">{checkIn.note}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">No check-ins yet.</p>
        )}
      </div>

      {summary ? (
        <div className="rounded-lg border border-emerald-100 bg-mint p-5">
          <h2 className="text-lg font-semibold text-ink">Agent Daily Summary</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{summary.summary}</p>
          {summary.ownerAttentionNeeded ? (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-white p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 shrink-0" size={17} />
              {summary.nextRecommendedAction}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
