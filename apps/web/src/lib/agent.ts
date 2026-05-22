const DEFAULT_AGENT_URL = "http://localhost:8080";

export function agentBaseUrl() {
  return (process.env.PET_GUARDIAN_AGENT_URL || DEFAULT_AGENT_URL).replace(/\/$/, "");
}

export async function agentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${agentBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Agent request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
