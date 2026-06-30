const STORAGE_KEY = "valzu_user_id";

export function getAnonymousUserId(): string {
  if (typeof window === "undefined") {
    throw new Error("getAnonymousUserId can only be called in the browser");
  }

  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}

export function getAnonymousUserIdOrNull(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}
