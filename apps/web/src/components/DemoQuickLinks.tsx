"use client";

import { LayoutDashboard, Loader2, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type DemoTarget = "dashboard" | "caregiver";

export function DemoQuickLinks({ variant = "light" }: { variant?: "light" | "dark" }) {
  const router = useRouter();
  const [loading, setLoading] = useState<DemoTarget | "">("");
  const isDark = variant === "dark";

  async function openDemo(target: DemoTarget) {
    setLoading(target);
    const response = await fetch("/api/demo/seed", { method: "POST" });
    const data = await response.json();
    router.push(target === "dashboard" ? `/owner/dashboard/${data.planId}` : `/caregiver/${data.shareToken}`);
  }

  const linkClass = isDark
    ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
    : "border-emerald-100 bg-white text-ink hover:bg-mint";

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${linkClass}`}
        disabled={Boolean(loading)}
        onClick={() => openDemo("dashboard")}
        type="button"
      >
        {loading === "dashboard" ? <Loader2 className="animate-spin" size={16} /> : <LayoutDashboard size={16} />}
        Owner Dashboard
      </button>
      <button
        className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${linkClass}`}
        disabled={Boolean(loading)}
        onClick={() => openDemo("caregiver")}
        type="button"
      >
        {loading === "caregiver" ? <Loader2 className="animate-spin" size={16} /> : <UsersRound size={16} />}
        Caregiver View
      </button>
    </div>
  );
}
