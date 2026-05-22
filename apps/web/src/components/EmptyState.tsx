export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm">
      <p className="font-semibold text-ink">{title}</p>
      {body ? <p className="mt-1 text-slate-600">{body}</p> : null}
    </div>
  );
}
