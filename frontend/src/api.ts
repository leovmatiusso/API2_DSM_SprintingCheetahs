import type { LoginResponse, Role, Time, User } from "./types";
import { getToken, logout as clearSession } from "./auth";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3001/api").replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401) {
    clearSession();
  }

  if (!response.ok) {
    throw new Error(data?.message ?? "Erro na requisição.");
  }

  return data as T;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<void> {
  return request<void>("/logout", { method: "POST" });
}

export function getAccount(): Promise<{ user: User }> {
  return request<{ user: User }>("/account");
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return request<void>("/change-password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function getUsers(): Promise<{ users: User[] }> {
  return request<{ users: User[] }>("/users");
}

export function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
  time_id?: string | null;
}): Promise<{ user: User }> {
  return request<{ user: User }>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    password: string;
    role: Role;
    active: boolean;
    time_id: string | null;
  }>,
): Promise<{ user: User }> {
  return request<{ user: User }>(`/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: string): Promise<void> {
  return request<void>(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function getTimes(): Promise<{ times: Time[] }> {
  return request<{ times: Time[] }>("/times");
}

export function createTime(data: {
  nome_time: string;
  departamento: string;
  responsavel_id: string | null;
  usuarios_ids: string[];
}): Promise<{ time: Time }> {
  return request<{ time: Time }>("/times", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTime(
  id: string,
  data: {
    nome_time: string;
    departamento: string;
    responsavel_id: string | null;
    usuarios_ids: string[];
  },
): Promise<{ time: Time }> {
  return request<{ time: Time }>(`/times/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteTime(id: string): Promise<void> {
  return request<void>(`/times/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function createOrdemServico(data: {
  os_titulo: string;
  os_descricao: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  os_cliente: string;
  data_limite: string;
  id_time_responsavel: string | number;
}): Promise<{ message: string; os: { os_id: number; os_status: string } }> {
  return request("/os", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getOrdensServico(): Promise<{ os: unknown[] }> {
  return request<{ os: unknown[] }>("/os");
}

export { API_URL };
