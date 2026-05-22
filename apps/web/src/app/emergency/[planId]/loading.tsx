import { LoadingState } from "@/components/LoadingState";

export default function LoadingEmergencyMode() {
  return (
    <main className="min-h-screen bg-[#f7faf6] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <LoadingState label="Loading emergency context" />
      </div>
    </main>
  );
}
