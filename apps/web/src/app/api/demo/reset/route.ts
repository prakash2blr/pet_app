import { NextResponse } from "next/server";
import { agentFetch } from "@/lib/agent";

export async function POST() {
  const data = await agentFetch("/demo/reset", {
    method: "POST",
    body: JSON.stringify({ resetKey: process.env.DEMO_RESET_KEY || "demo123" })
  });
  return NextResponse.json(data);
}
