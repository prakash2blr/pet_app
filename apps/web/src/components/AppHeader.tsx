import { PawPrint } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AppHeaderProps = {
  href?: string;
  variant?: "light" | "dark";
  rightSlot?: ReactNode;
  className?: string;
};

export function AppHeader({ href = "/", variant = "light", rightSlot, className = "" }: AppHeaderProps) {
  const isDark = variant === "dark";

  return (
    <header
      className={`flex min-h-16 flex-col items-stretch justify-between gap-4 rounded-lg border px-4 py-3 sm:flex-row sm:items-center ${
        isDark ? "border-white/20 bg-white/10 backdrop-blur" : "border-emerald-100 bg-white/85 shadow-sm"
      } ${className}`}
    >
      <Link className="focus-ring group inline-flex items-center gap-3 rounded-lg" href={href} aria-label="Pet Guardian home">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-lg shadow-soft ${
            isDark ? "bg-white text-leaf" : "bg-leaf text-white"
          }`}
        >
          <PawPrint size={22} />
        </span>
        <span className="leading-tight">
          <span className={`block text-base font-black ${isDark ? "text-white" : "text-ink"}`}>Pet Guardian</span>
          <span className={`block text-xs font-semibold uppercase tracking-[0.16em] ${isDark ? "text-honey" : "text-leaf"}`}>
            Care agent
          </span>
        </span>
      </Link>
      {rightSlot ? <div className="flex shrink-0 items-center justify-start gap-2 sm:justify-end">{rightSlot}</div> : null}
    </header>
  );
}
