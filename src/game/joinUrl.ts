const JOIN_PARAM = "join";

export function buildJoinUrl(code: string): string {
  const url = new URL(import.meta.env.BASE_URL, window.location.origin);
  url.searchParams.set(JOIN_PARAM, code);
  return url.toString();
}

export function getJoinCodeFromLocation(): string | null {
  const code = new URLSearchParams(window.location.search).get(JOIN_PARAM);
  const normalized = code?.trim().toUpperCase();
  return normalized ? normalized : null;
}

export function clearJoinCodeFromLocation(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(JOIN_PARAM)) return;
  url.searchParams.delete(JOIN_PARAM);
  window.history.replaceState({}, "", url.toString());
}
