import type { LoginResponse, User } from "./types";

const USER_KEY = "sistema-os-user";
const TOKEN_KEY = "sistema-os-token";

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    logout();
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveSession(result: LoginResponse): void {
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  localStorage.setItem(TOKEN_KEY, result.token);
}

export function logout(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
