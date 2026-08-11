// Thin wrapper around browser localStorage so the rest of the app
// never touches JSON.parse/stringify or try/catch directly.

const PREFIX = "fre_";

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Storage read failed for "${key}":`, err);
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): boolean {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Storage write failed for "${key}":`, err);
    return false;
  }
}

export function clearAll(keys: string[]): void {
  if (typeof window === "undefined") return;
  keys.forEach((key) => window.localStorage.removeItem(PREFIX + key));
}
