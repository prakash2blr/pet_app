import { LoadingState } from "@/components/LoadingState";

export default function LoadingCaregiverChecklist() {
  return (
    <main className="min-h-screen bg-[#f7faf6] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <LoadingState label="Loading caregiver checklist" />
      </div>
    </main>
  );
}
