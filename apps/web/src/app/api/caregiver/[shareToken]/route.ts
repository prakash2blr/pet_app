import { NextResponse } from "next/server";
import { agentFetch } from "@/lib/agent";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;
  const data = await agentFetch(`/agent/caregiver/${shareToken}`);
  return NextResponse.json(data);
}
