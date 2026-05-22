import { NextRequest, NextResponse } from "next/server";
import { agentFetch } from "@/lib/agent";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const data = await agentFetch("/agent/emergency-summary", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return NextResponse.json(data);
}
