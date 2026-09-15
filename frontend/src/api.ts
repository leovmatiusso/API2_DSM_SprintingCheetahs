import type { LoginResponse, Role, User } from "./types";
import { getToken } from "./auth";

const API_URL = "http://localhost:3001/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json() as T & { message?: string };
  if (!response.ok) throw new Error(data.message ?? "Erro na requisição.");
  return data;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function getAccount(): Promise<{ user: User }> {
  return request<{ user: User }>("/account");
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return request<void>("/change-password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword })
  });
}

export function getUsers(): Promise<{ users: User[] }> {
  return request<{ users: User[] }>("/users");
}

export function createUser(data: { name: string; email: string; password: string; role: Role }): Promise<{ user: User }> {
  return request<{ user: User }>("/users", { method: "POST", body: JSON.stringify(data) });
}

export function updateUser(id: string, data: Partial<{ name: string; email: string; password: string; role: Role; active: boolean }>): Promise<{ user: User }> {
  return request<{ user: User }>(`/users/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteUser(id: string): Promise<void> {
  return request<void>(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
}
