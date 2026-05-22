import { NextResponse } from "next/server";
import { agentFetch } from "@/lib/agent";

export async function POST() {
  const data = await agentFetch("/demo/seed", { method: "POST" });
  return NextResponse.json(data);
}
