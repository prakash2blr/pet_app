export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-white p-4 text-sm text-slate-600 shadow-soft">
      <span className="h-3 w-3 animate-pulse rounded-full bg-leaf" />
      {label}
    </div>
  );
}
