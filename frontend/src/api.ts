import type { LoginResponse, Role, Time, User } from "./types";

import { getToken } from "./auth";

const API_URL = "http://localhost:3001/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message ?? "Erro na requisição.");
  }

  return data as T;
}

// =====================================================
// LOGIN
// =====================================================

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

// =====================================================
// LOGOUT
// =====================================================

export function logout(): Promise<void> {
  return request<void>("/logout", {
    method: "POST",
  });
}

// =====================================================
// MINHA CONTA
// =====================================================

export function getAccount(): Promise<{
  user: User;
}> {
  return request<{
    user: User;
  }>("/account");
}

// =====================================================
// ALTERAR SENHA
// =====================================================

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return request<void>("/change-password", {
    method: "PUT",
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });
}

// =====================================================
// USUÁRIOS
// =====================================================

export function getUsers(): Promise<{
  users: User[];
}> {
  return request<{
    users: User[];
  }>("/users");
}

// =====================================================
// CADASTRAR USUÁRIO
// =====================================================

export function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
  time_id?: string | null;
}): Promise<{
  user: User;
}> {
  return request<{
    user: User;
  }>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// =====================================================
// EDITAR USUÁRIO
// =====================================================

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
): Promise<{
  user: User;
}> {
  return request<{
    user: User;
  }>(`/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// =====================================================
// EXCLUIR USUÁRIO
// =====================================================

export function deleteUser(id: string): Promise<void> {
  return request<void>(`/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// =====================================================
// TIMES
// =====================================================

export function getTimes(): Promise<{
  times: Time[];
}> {
  return request<{
    times: Time[];
  }>("/times");
}

// =====================================================
// CADASTRAR TIME
// =====================================================

export function createTime(data: {
  nome_time: string;
  departamento: string;
  responsavel_id: string | null;
  usuarios_ids: string[];
}): Promise<{
  time: Time;
}> {
  return request<{
    time: Time;
  }>("/times", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// =====================================================
// EDITAR TIME
// =====================================================

export function updateTime(
  id: string,
  data: {
    nome_time: string;
    departamento: string;
    responsavel_id: string | null;
    usuarios_ids: string[];
  },
): Promise<{
  time: Time;
}> {
  return request<{
    time: Time;
  }>(`/times/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// =====================================================
// EXCLUIR TIME
// =====================================================

export function deleteTime(id: string): Promise<void> {
  return request<void>(`/times/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
