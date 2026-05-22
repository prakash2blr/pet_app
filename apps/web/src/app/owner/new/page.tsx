import { AppHeader } from "@/components/AppHeader";
import { OwnerCreateForm } from "@/components/OwnerCreateForm";

export default async function OwnerNewPage({
  searchParams
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-[#f7faf6] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <AppHeader href="/" />
        <div className="mt-5">
          <h1 className="text-3xl font-black text-ink">Create Care Plan</h1>
          <p className="mt-2 text-slate-600">Turn owner notes into an agent-generated care handover.</p>
        </div>
        <div className="mt-6">
          <OwnerCreateForm prefillDemo={params.demo === "1"} />
        </div>
      </div>
    </main>
  );
}
