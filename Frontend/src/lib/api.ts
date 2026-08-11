export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "flux_token";

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error("Failed to persist session token:", err);
  }
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

export async function api<T = unknown>(
  path: string,
  { method = "GET", body, auth = true }: ApiOptions = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_BASE + "/api" + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: T | null;
  try {
    data = (await res.json()) as T;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const error = new Error(
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : null) || `Request failed (${res.status}).`
    ) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return data as T;
}
