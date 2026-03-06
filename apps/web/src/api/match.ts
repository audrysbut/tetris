import { useState, useCallback, useEffect } from "react";

const API_URL = import.meta.env?.VITE_API_URL ?? "http://localhost:3000";

export interface CreateMatchResult {
  matchId: string;
  actionsDestination: string;
  updatesDestination: string;
}

export interface JoinMatchResult {
  matchId: string;
  playerId: 1 | 2;
  actionsDestination: string;
  updatesDestination: string;
  gameStarted: boolean;
}

export async function createMatch(): Promise<CreateMatchResult> {
  const res = await fetch(`${API_URL}/match/create`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create match");
  return res.json();
}

export async function joinMatch(matchId: string): Promise<JoinMatchResult | { error: string }> {
  const res = await fetch(`${API_URL}/match/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchId }),
  });
  const data = await res.json();
  if (!res.ok) return data;
  return data as JoinMatchResult;
}
