"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { CarePlanForm, type CarePlanFormValue } from "./CarePlanForm";
import { DogProfileForm, type DogFormValue } from "./DogProfileForm";

const demoDog: DogFormValue = {
  ownerName: "Prakash",
  name: "Bruno",
  breed: "Labrador",
  age: "4 years",
  weight: "28 kg",
  allergies: "Chicken",
  medications: "Liver tablet after dinner",
  foodRoutine: "One scoop dry food at 8 AM and 8 PM",
  behaviourNotes: "Pulls on leash. Avoid street dogs. Gets anxious during thunder.",
  vetName: "Dr Rao",
  vetPhone: "+91 98765 43210",
  emergencyName: "Prakash",
  emergencyPhone: "+91 90000 00000"
};

const demoPlan: CarePlanFormValue = {
  title: "Bruno 3-day care plan",
  startDate: "2026-06-01",
  endDate: "2026-06-03",
  caregiverName: "Rahul",
  caregiverContact: "",
  ownerInstructionsRaw:
    "I am travelling for 3 days from 1 June to 3 June. Bruno needs food at 8 AM and 8 PM. Give his liver tablet after dinner. Take him for a morning and evening walk, but avoid street dogs because he gets reactive. Refill water twice daily. Please watch for loose motion because he had stomach issues last week."
};

const emptyDog: DogFormValue = {
  ownerName: "",
  name: "",
  breed: "",
  age: "",
  weight: "",
  allergies: "",
  medications: "",
  foodRoutine: "",
  behaviourNotes: "",
  vetName: "",
  vetPhone: "",
  emergencyName: "",
  emergencyPhone: ""
};

const emptyPlan: CarePlanFormValue = {
  title: "",
  startDate: "",
  endDate: "",
  caregiverName: "",
  caregiverContact: "",
  ownerInstructionsRaw: ""
};

function listFromText(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function OwnerCreateForm({ prefillDemo = false }: { prefillDemo?: boolean }) {
  const router = useRouter();
  const [dog, setDog] = useState<DogFormValue>(prefillDemo ? demoDog : emptyDog);
  const [plan, setPlan] = useState<CarePlanFormValue>(prefillDemo ? demoPlan : emptyPlan);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const busy = loading || redirecting;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setRedirecting(false);
    setError("");
    let didRedirect = false;

    const payload = {
      dog: {
        ownerName: dog.ownerName,
        name: dog.name,
        breed: dog.breed,
        age: dog.age,
        weight: dog.weight,
        allergies: listFromText(dog.allergies),
        medications: listFromText(dog.medications),
        foodRoutine: dog.foodRoutine,
        behaviourNotes: dog.behaviourNotes,
        vet: { name: dog.vetName, phone: dog.vetPhone },
        emergencyContact: { name: dog.emergencyName, phone: dog.emergencyPhone }
      },
      plan
    };

    try {
      const response = await fetch("/api/care-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      didRedirect = true;
      setRedirecting(true);
      router.push(`/owner/plan/${data.planId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate care plan");
    } finally {
      if (!didRedirect) {
        setLoading(false);
      }
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <DogProfileForm value={dog} onChange={setDog} />
      <CarePlanForm value={plan} onChange={setPlan} />
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {busy ? (
        <div className="rounded-lg border border-emerald-200 bg-mint p-4 text-sm text-leaf" role="status">
          <div className="flex items-center gap-3 font-semibold">
            <LoaderCircle className="animate-spin" size={18} />
            {redirecting ? "Opening generated plan review" : "Generating care plan with the Pet Guardian agent"}
          </div>
          <p className="mt-2 text-slate-700">
            {redirecting
              ? "Loading the saved care plan, generated tasks, and caregiver link from the agent service."
              : "Creating the handover summary, safety warnings, caregiver checklist, and shareable links."}
          </p>
        </div>
      ) : null}
      <button
        className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-leaf px-5 py-3 text-base font-semibold text-white shadow-soft disabled:cursor-wait disabled:opacity-75 sm:w-auto"
        disabled={busy}
        type="submit"
      >
        {busy ? <LoaderCircle className="animate-spin" size={19} /> : <Sparkles size={19} />}
        {redirecting ? "Opening Review..." : loading ? "Generating Care Plan..." : "Generate AI Care Plan"}
      </button>
    </form>
  );
}
