type DogFormValue = {
  ownerName: string;
  name: string;
  breed: string;
  age: string;
  weight: string;
  allergies: string;
  medications: string;
  foodRoutine: string;
  behaviourNotes: string;
  vetName: string;
  vetPhone: string;
  emergencyName: string;
  emergencyPhone: string;
};

export function DogProfileForm({
  value,
  onChange
}: {
  value: DogFormValue;
  onChange: (value: DogFormValue) => void;
}) {
  const set = (key: keyof DogFormValue, next: string) => onChange({ ...value, [key]: next });

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Dog Profile</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Owner name" value={value.ownerName} onChange={(v) => set("ownerName", v)} />
        <Field label="Dog name" value={value.name} onChange={(v) => set("name", v)} required />
        <Field label="Breed" value={value.breed} onChange={(v) => set("breed", v)} />
        <Field label="Age" value={value.age} onChange={(v) => set("age", v)} />
        <Field label="Weight" value={value.weight} onChange={(v) => set("weight", v)} />
        <Field label="Allergies" value={value.allergies} onChange={(v) => set("allergies", v)} />
        <Field label="Medicines" value={value.medications} onChange={(v) => set("medications", v)} />
        <Field label="Vet name" value={value.vetName} onChange={(v) => set("vetName", v)} />
        <Field label="Vet phone" value={value.vetPhone} onChange={(v) => set("vetPhone", v)} />
        <Field label="Emergency contact" value={value.emergencyName} onChange={(v) => set("emergencyName", v)} />
        <Field label="Emergency phone" value={value.emergencyPhone} onChange={(v) => set("emergencyPhone", v)} />
      </div>
      <label className="mt-3 block text-sm font-medium text-slate-700">
        Food routine
        <textarea
          className="focus-ring mt-1 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
          value={value.foodRoutine}
          onChange={(event) => set("foodRoutine", event.target.value)}
        />
      </label>
      <label className="mt-3 block text-sm font-medium text-slate-700">
        Behaviour notes
        <textarea
          className="focus-ring mt-1 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
          value={value.behaviourNotes}
          onChange={(event) => set("behaviourNotes", event.target.value)}
        />
      </label>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="focus-ring mt-1 h-11 w-full rounded-lg border border-slate-300 px-3"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export type { DogFormValue };
