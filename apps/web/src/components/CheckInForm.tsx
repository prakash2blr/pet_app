"use client";

import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import type { CareTask, Severity, TaskStatus } from "@/types";
import { StatusBadge } from "./StatusBadge";

export function CheckInForm({ task }: { task: CareTask }) {
  const router = useRouter();
  const [status, setStatus] = useState<TaskStatus>("done");
  const [severity, setSeverity] = useState<Severity>("normal");
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const busy = loading || isRefreshing;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task._id,
          planId: task.planId,
          dogId: task.dogId,
          status,
          note,
          photoUrl,
          severity,
          submittedBy: "Caregiver"
        })
      });

      if (!response.ok) {
        setMessage("Could not save check-in.");
        return;
      }

      setOptimisticStatus(status);
      setMessage(status === "issue" ? "Issue recorded. Emergency mode is available." : "Check-in saved.");
      startRefresh(() => {
        router.refresh();
      });
    } catch {
      setMessage("Could not save check-in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form aria-busy={busy} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={submit}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">{task.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{task.description}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
            {task.dueTime ? <span className="rounded-full bg-slate-100 px-2 py-1">{task.dueTime}</span> : null}
            <span className="rounded-full bg-skyglass px-2 py-1">{task.type}</span>
            {task.critical ? <StatusBadge value="critical" /> : null}
          </div>
        </div>
        <StatusBadge value={optimisticStatus || task.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {(["done", "skipped", "issue"] as TaskStatus[]).map((value) => (
          <button
            className={`focus-ring min-h-10 rounded-lg border px-2 text-sm font-semibold ${
              status === value ? "border-leaf bg-mint text-leaf" : "border-slate-200 bg-white text-slate-700"
            }`}
            disabled={busy}
            key={value}
            onClick={() => setStatus(value)}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>

      <label className="mt-3 block text-sm font-medium text-slate-700">
        Note
        <textarea
          className="focus-ring mt-1 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
          disabled={busy}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Photo URL
          <input
            className="focus-ring mt-1 h-11 w-full rounded-lg border border-slate-300 px-3"
            disabled={busy}
            value={photoUrl}
            onChange={(event) => setPhotoUrl(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Severity
          <select
            className="focus-ring mt-1 h-11 w-full rounded-lg border border-slate-300 px-3"
            disabled={busy}
            value={severity}
            onChange={(event) => setSeverity(event.target.value as Severity)}
          >
            <option value="normal">normal</option>
            <option value="watch">watch</option>
            <option value="urgent">urgent</option>
          </select>
        </label>
      </div>
      <button
        className="focus-ring mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-80"
        disabled={busy}
        type="submit"
      >
        {busy ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
        {loading ? "Saving Check-in" : isRefreshing ? "Updating Status" : "Submit Check-in"}
      </button>
      <div aria-live="polite" className="mt-3 min-h-5 text-sm font-medium">
        {loading ? <p className="text-slate-600">Saving check-in and updating the checklist...</p> : null}
        {!loading && isRefreshing ? <p className="text-slate-600">Refreshing the latest task status...</p> : null}
        {!busy && message ? <p className={message.startsWith("Could") ? "text-red-700" : "text-leaf"}>{message}</p> : null}
      </div>
    </form>
  );
}
