type LostDogPlan = {
  immediateActions: string[];
  searchChecklist: string[];
  whatsappAlert: string;
  posterText: string;
  ownerScript: string;
  disclaimer: string;
};

type MediaPreview = {
  name: string;
  type: string;
  url: string;
  kind: "image" | "video";
};

export function LostDogPlanCard({ plan, media = [] }: { plan: LostDogPlan; media?: MediaPreview[] }) {
  return (
    <article className="rounded-lg border border-amber-200 bg-white p-5 shadow-soft">
      <h2 className="text-xl font-bold text-ink">Lost Dog Action Plan</h2>
      <AttachedDogMedia media={media} />
      <PlanList title="Immediate Actions" items={plan.immediateActions} />
      <PlanList title="Search Checklist" items={plan.searchChecklist} />
      <TextBlock title="WhatsApp Alert" value={plan.whatsappAlert} />
      <TextBlock title="Poster Text" value={plan.posterText} />
      <TextBlock title="Owner Script" value={plan.ownerScript} />
      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{plan.disclaimer}</p>
    </article>
  );
}

function AttachedDogMedia({ media }: { media: MediaPreview[] }) {
  if (!media.length) return null;

  return (
    <div className="mt-4 rounded-lg bg-slate-50 p-3">
      <h3 className="font-semibold text-ink">Dog Photo / Video</h3>
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

function PlanList({ title, items }: { title: string; items: string[] }) {
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

function TextBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="mt-4 rounded-lg bg-slate-50 p-3">
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{value}</p>
    </div>
  );
}

export type { LostDogPlan };
