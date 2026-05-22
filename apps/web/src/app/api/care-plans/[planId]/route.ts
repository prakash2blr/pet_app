import { NextResponse } from "next/server";
import { agentFetch } from "@/lib/agent";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;
  const data = await agentFetch(`/agent/plan/${planId}`);
  return NextResponse.json(data);
}
