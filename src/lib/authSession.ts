import { API_BASE_URL } from "./apiBase";

export type RefreshOutcome =
  | { ok: true }
  | { ok: false; definitive: boolean };

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phoneNo?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

export type SessionCheck =
  | { kind: "ok"; user: AuthUser }
  | { kind: "unauthenticated" }
  | { kind: "unavailable" };

const JSON_HEADERS = { "x-portal": "tenant" };

let inflightRefresh: Promise<RefreshOutcome> | null = null;
let lastRefreshOkAt = 0;
const REFRESH_REUSE_MS = 2000;

export function refreshSession(): Promise<RefreshOutcome> {
  if (inflightRefresh) return inflightRefresh;
  if (Date.now() - lastRefreshOkAt < REFRESH_REUSE_MS) return Promise.resolve({ ok: true });

  inflightRefresh = (async (): Promise<RefreshOutcome> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: JSON_HEADERS,
      });
      if (res.ok) {
        lastRefreshOkAt = Date.now();
        return { ok: true };
      }
      return { ok: false, definitive: res.status === 401 || res.status === 403 };
    } catch {
      return { ok: false, definitive: false };
    } finally {
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
}

export async function checkSession(): Promise<SessionCheck> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: JSON_HEADERS,
    });

    if (res.ok) {
      const data = await res.json();
      const user = data?.data?.user || data?.data || data?.user;
      if (user) return { kind: "ok", user };
    }

    if (res.status === 401 || res.status === 403) {
      const refreshed = await refreshSession();
      if (refreshed.ok) {
        const retryRes = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: JSON_HEADERS,
        });
        if (retryRes.ok) {
          const data = await retryRes.json();
          const user = data?.data?.user || data?.data || data?.user;
          if (user) return { kind: "ok", user };
        }
      }
      return { kind: "unauthenticated" };
    }

    return { kind: "unavailable" };
  } catch {
    return { kind: "unavailable" };
  }
}

