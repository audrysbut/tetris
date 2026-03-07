import type {
  CreateMatchResult,
  JoinMatchResult,
  MatchErrorResponse,
} from "@shared/mod";

const API_URL = import.meta.env?.VITE_API_URL ?? "http://localhost:3000";

function isJoinMatchResult(data: unknown): data is JoinMatchResult {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return (
    typeof o.matchId === "string" &&
    (o.playerId === 1 || o.playerId === 2) &&
    typeof o.actionsDestination === "string" &&
    typeof o.updatesDestination === "string" &&
    typeof o.gameStarted === "boolean"
  );
}

export type { CreateMatchResult, JoinMatchResult };

export async function createMatch(): Promise<CreateMatchResult> {
  const res = await fetch(`${API_URL}/match/create`, { method: "POST" });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data && typeof data === "object" && "error" in data
      ? (data as { error: string }).error
      : `Failed to create match (${res.status})`;
    throw new Error(msg);
  }
  if (!data || typeof data !== "object" || typeof (data as CreateMatchResult).matchId !== "string") {
    throw new Error("Invalid response from server");
  }
  return data as CreateMatchResult;
}

export async function joinMatch(
  matchId: string
): Promise<JoinMatchResult | MatchErrorResponse> {
  const res = await fetch(`${API_URL}/match/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchId }),
  });
  const data: unknown = await res.json();
  if (!res.ok) return data as MatchErrorResponse;
  if (!isJoinMatchResult(data)) {
    throw new Error("Invalid response from server");
  }
  return data;
}
