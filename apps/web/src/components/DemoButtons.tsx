"use client";

import { RotateCcw, UserRound, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DemoButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  async function seed(target: "owner" | "caregiver") {
    setLoading(target);
    const response = await fetch("/api/demo/seed", { method: "POST" });
    const data = await response.json();
    setLoading("");
    router.push(target === "owner" ? `/owner/plan/${data.planId}` : `/caregiver/${data.shareToken}`);
  }

  async function reset() {
    setLoading("reset");
    await fetch("/api/demo/reset", { method: "POST" });
    setLoading("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-honey px-5 py-3 font-semibold text-ink"
        disabled={loading === "owner"}
        onClick={() => seed("owner")}
        type="button"
      >
        <UserRound size={18} />
        {loading === "owner" ? "Starting Demo" : "Try Demo as Owner"}
      </button>
      <button
        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-ink"
        disabled={loading === "caregiver"}
        onClick={() => seed("caregiver")}
        type="button"
      >
        <UsersRound size={18} />
        {loading === "caregiver" ? "Starting Demo" : "Try Demo as Caregiver"}
      </button>
      <button
        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/40 px-5 py-3 font-semibold text-white"
        disabled={loading === "reset"}
        onClick={reset}
        type="button"
      >
        <RotateCcw size={18} />
        Reset Demo
      </button>
    </div>
  );
}
