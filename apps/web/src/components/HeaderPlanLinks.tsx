import { ExternalLink, LayoutDashboard, ListChecks, UsersRound } from "lucide-react";
import Link from "next/link";

export function HeaderPlanLinks({
  planId,
  shareToken,
  showPlanReview = true,
  showDashboard = true,
  showCaregiver = true,
  variant = "light"
}: {
  planId: string;
  shareToken?: string;
  showPlanReview?: boolean;
  showDashboard?: boolean;
  showCaregiver?: boolean;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  const linkClass = isDark
    ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
    : "border-emerald-100 bg-white text-ink hover:bg-mint";

  return (
    <nav className="flex flex-wrap justify-end gap-2" aria-label="Demo navigation">
      {showPlanReview ? (
        <Link className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${linkClass}`} href={`/owner/plan/${planId}`}>
          <ListChecks size={16} />
          Plan Review
        </Link>
      ) : null}
      {showDashboard ? (
        <Link className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${linkClass}`} href={`/owner/dashboard/${planId}`}>
          <LayoutDashboard size={16} />
          Owner Dashboard
        </Link>
      ) : null}
      {showCaregiver && shareToken ? (
        <Link className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${linkClass}`} href={`/caregiver/${shareToken}`}>
          <UsersRound size={16} />
          Caregiver View
        </Link>
      ) : null}
      {showCaregiver && !shareToken ? (
        <span className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold opacity-60 ${linkClass}`}>
          <ExternalLink size={16} />
          Caregiver View
        </span>
      ) : null}
    </nav>
  );
}
