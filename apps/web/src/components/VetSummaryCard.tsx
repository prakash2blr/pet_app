type VetSummary = {
  vetReadySummary: string;
  timeline: string[];
  criticalKnownInfo: string[];
  questionsForVet: string[];
  recommendedNextSteps: string[];
  disclaimer: string;
};

type MediaPreview = {
  name: string;
  type: string;
  url: string;
  kind: "image" | "video";
};

export function VetSummaryCard({ summary, media = [] }: { summary: VetSummary; media?: MediaPreview[] }) {
  return (
    <article className="rounded-lg border border-red-200 bg-white p-5 shadow-soft">
      <h2 className="text-xl font-bold text-ink">Vet-ready Summary</h2>
      <p className="mt-3 leading-7 text-slate-700">{summary.vetReadySummary}</p>
      <AttachedMedia media={media} />
      <SummaryList title="Timeline" items={summary.timeline} />
      <SummaryList title="Critical Known Info" items={summary.criticalKnownInfo} />
      <SummaryList title="Questions For Vet" items={summary.questionsForVet} />
      <SummaryList title="Recommended Next Steps" items={summary.recommendedNextSteps} />
      <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{summary.disclaimer}</p>
    </article>
  );
}

function AttachedMedia({ media }: { media: MediaPreview[] }) {
  if (!media.length) return null;

  return (
    <div className="mt-4 rounded-lg bg-slate-50 p-3">
      <h3 className="font-semibold text-ink">Attached Photo / Video</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {media.map((item) => (
          <div key={item.url} className="rounded-lg border border-slate-200 bg-white p-2">
            <p className="truncate text-xs font-medium text-slate-600">{item.name}</p>
            {item.kind === "video" ? (
              <video className="mt-2 max-h-80 w-full rounded-lg bg-black object-contain" src={item.url} controls />
            ) : (
              <img className="mt-2 max-h-80 w-full rounded-lg bg-slate-100 object-contain" src={item.url} alt={item.name} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <h3 className="font-semibold text-ink">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export type { VetSummary };
