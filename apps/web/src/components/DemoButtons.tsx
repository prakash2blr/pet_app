"use client";

import { Loader2, RotateCcw, UserRound, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DemoButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function seed(target: "owner" | "caregiver") {
    setLoading(target);
    setError("");

    try {
      const response = await fetch("/api/demo/seed", { method: "POST" });
      if (!response.ok) throw new Error("Demo setup failed. Please try again.");
      const data = await response.json();
      router.push(target === "owner" ? `/owner/plan/${data.planId}` : `/caregiver/${data.shareToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo setup failed. Please try again.");
      setLoading("");
    }
  }

  async function reset() {
    setLoading("reset");
    setError("");

    try {
      const response = await fetch("/api/demo/reset", { method: "POST" });
      if (!response.ok) throw new Error("Demo reset failed. Please try again.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo reset failed. Please try again.");
    } finally {
      setLoading("");
    }
  }

  const loadingTitle =
    loading === "owner"
      ? "Preparing Owner Demo"
      : loading === "caregiver"
        ? "Preparing Caregiver Demo"
        : loading === "reset"
          ? "Resetting Demo"
          : "";
  const loadingBody =
    loading === "owner"
      ? "Creating a Bruno care plan, tasks, and owner links."
      : loading === "caregiver"
        ? "Creating a Bruno care plan and opening the caregiver checklist."
        : loading === "reset"
          ? "Clearing demo plans, check-ins, and emergency logs."
          : "";

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-honey px-5 py-3 font-semibold text-ink disabled:opacity-70"
          disabled={Boolean(loading)}
          onClick={() => seed("owner")}
          type="button"
        >
          {loading === "owner" ? <Loader2 className="animate-spin" size={18} /> : <UserRound size={18} />}
          {loading === "owner" ? "Preparing Owner Demo" : "Try Demo as Owner"}
        </button>
        <button
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-ink disabled:opacity-70"
          disabled={Boolean(loading)}
          onClick={() => seed("caregiver")}
          type="button"
        >
          {loading === "caregiver" ? <Loader2 className="animate-spin" size={18} /> : <UsersRound size={18} />}
          {loading === "caregiver" ? "Preparing Caregiver Demo" : "Try Demo as Caregiver"}
        </button>
        <button
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/40 px-5 py-3 font-semibold text-white disabled:opacity-70"
          disabled={Boolean(loading)}
          onClick={reset}
          type="button"
        >
          {loading === "reset" ? <Loader2 className="animate-spin" size={18} /> : <RotateCcw size={18} />}
          {loading === "reset" ? "Resetting Demo" : "Reset Demo"}
        </button>
      </div>
      {error ? <p className="mt-3 max-w-xl rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 px-5 backdrop-blur-sm" role="status" aria-live="polite">
          <div className="w-full max-w-sm rounded-lg border border-white/30 bg-white p-5 text-ink shadow-soft">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-mint text-leaf">
                <Loader2 className="animate-spin" size={22} />
              </span>
              <div>
                <p className="font-black">{loadingTitle}</p>
                <p className="mt-1 text-sm text-slate-600">{loadingBody}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
