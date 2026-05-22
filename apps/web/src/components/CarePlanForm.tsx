export type CarePlanFormValue = {
  title: string;
  startDate: string;
  endDate: string;
  caregiverName: string;
  caregiverContact: string;
  ownerInstructionsRaw: string;
};

export function CarePlanForm({
  value,
  onChange
}: {
  value: CarePlanFormValue;
  onChange: (value: CarePlanFormValue) => void;
}) {
  const set = (key: keyof CarePlanFormValue, next: string) => onChange({ ...value, [key]: next });

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Care Plan</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Plan title" value={value.title} onChange={(v) => set("title", v)} required />
        <Field label="Caregiver name" value={value.caregiverName} onChange={(v) => set("caregiverName", v)} />
        <Field label="Start date" type="date" value={value.startDate} onChange={(v) => set("startDate", v)} required />
        <Field label="End date" type="date" value={value.endDate} onChange={(v) => set("endDate", v)} required />
        <Field label="Caregiver contact" value={value.caregiverContact} onChange={(v) => set("caregiverContact", v)} />
      </div>
      <label className="mt-3 block text-sm font-medium text-slate-700">
        Owner instructions
        <textarea
          className="focus-ring mt-1 min-h-40 w-full rounded-lg border border-slate-300 px-3 py-2"
          required
          value={value.ownerInstructionsRaw}
          onChange={(event) => set("ownerInstructionsRaw", event.target.value)}
        />
      </label>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="focus-ring mt-1 h-11 w-full rounded-lg border border-slate-300 px-3"
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
