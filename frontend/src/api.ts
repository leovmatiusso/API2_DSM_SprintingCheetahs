import type { LoginResponse, Role, Time, User } from "./types";
import { getToken, logout as clearSession } from "./auth";

const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/api"
).replace(/\/$/, "");

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (
    !headers.has("Content-Type") &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

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

  if (response.status === 401) {
    clearSession();
  }

  if (!response.ok) {
    throw new Error(data?.message ?? "Erro na requisição.");
  }

  return data as T;
}

export function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return request<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<void> {
  return request<void>("/logout", {
    method: "POST",
  });
}

export function getAccount(): Promise<{ user: User }> {
  return request<{ user: User }>("/account");
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  return request<void>("/change-password", {
    method: "PUT",
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
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
  return request<{ user: User }>(
    `/users/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

export function deleteUser(id: string): Promise<void> {
  return request<void>(
    `/users/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
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
  return request<{ time: Time }>(
    `/times/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

export function deleteTime(id: string): Promise<void> {
  return request<void>(
    `/times/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}

export function createOrdemServico(data: {
  os_titulo: string;
  os_descricao: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  data_limite: string;
  id_time_responsavel: string | number;
}): Promise<{
  message: string;
  os: {
    os_id: number;
    os_status: string;
  };
}> {
  return request("/os", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getOrdensServico(): Promise<{
  os: unknown[];
}> {
  return request<{ os: unknown[] }>("/os");
}

// =====================================================
// ANEXOS (abrir PDF/imagem em nova aba ou baixar)
// =====================================================

export interface ProjetoAnexo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
}

export type ManutencaoAnexo = ProjetoAnexo;

// Baixa o anexo com o token de sessão e abre em nova aba (PDF/imagem)
// ou dispara o download (demais tipos).
async function abrirAnexoPorCaminho(
  caminho: string,
  anexo: ProjetoAnexo,
): Promise<void> {
  const token = getToken();
  const response = await fetch(`${API_URL}${caminho}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let mensagem = "Não foi possível abrir o anexo.";
    try {
      mensagem = (await response.json())?.message ?? mensagem;
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(mensagem);
  }

  const bruto = await response.blob();
  const visualizavel =
    anexo.tipo === "application/pdf" || /^image\/(png|jpe?g|gif|webp)$/.test(anexo.tipo);
  // Só PDF/imagem são abertos inline; qualquer outro tipo vira download,
  // evitando executar HTML/JS enviado como anexo.
  const blob = new Blob([bruto], {
    type: visualizavel ? anexo.tipo : "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);

  if (visualizavel) {
    window.open(url, "_blank", "noopener");
  } else {
    const link = document.createElement("a");
    link.href = url;
    link.download = anexo.nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// =====================================================
// PROJETOS
// =====================================================

export interface ProjetoPayload {
  nome: string;
  data_assinatura_contrato: string;
  data_vencimento_contrato: string;
  tipo_sistema: string;
  id_time_responsavel: number;
  vendedor_nome: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  descricao?: string;
  equipamentos: { nome_equipamento: string; quantidade: number }[];
  anexos: {
    nome_anexo: string;
    anexo_tipo: string;
    anexo_tamanho: number;
    conteudo_arquivo_base64: string;
  }[];
}

export function getTimesParaProjeto(): Promise<{
  times: { id_time: number; nome_time: string }[];
}> {
  return request("/projetos/times");
}

export function getVendedores(): Promise<{
  vendedores: { id_usuario: number; nome: string }[];
}> {
  return request("/projetos/vendedores");
}

export function createProjeto(data: ProjetoPayload): Promise<{
  message: string;
  projeto: { projeto_id: number };
}> {
  return request("/projetos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface Projeto {
  id: string;
  nome: string;
  tipo_sistema: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  descricao: string;
  data_assinatura_contrato: string | null;
  data_vencimento_contrato: string | null;
  responsavel: string | null;
  vendedor: string | null;
  time: { id: string; nome: string } | null;
  membros_time: string[];
  equipamentos: { nome: string; quantidade: number }[];
  anexos: ProjetoAnexo[];
}

export function getProjetos(): Promise<{ projetos: Projeto[] }> {
  return request("/projetos");
}

export function abrirAnexoProjeto(
  projetoId: string,
  anexo: ProjetoAnexo,
): Promise<void> {
  return abrirAnexoPorCaminho(
    `/projetos/${encodeURIComponent(projetoId)}/anexos/${encodeURIComponent(anexo.id)}`,
    anexo,
  );
}

export { API_URL };

// =====================================================
// MANUTENÇÕES
// =====================================================

export interface ManutencaoPayload {
  resumo: string;

  tipo_manutencao:
    | "preventiva"
    | "corretiva"
    | "adaptativa"
    | "evolutiva";

  responsavel_nome: string;

  id_time_responsavel: number;

  data_inicio_problema: string;

  prioridade:
    | "baixa"
    | "media"
    | "alta"
    | "critica";

  descricao_situacao: string;

  equipamentos: {
    nome_equipamento: string;
    quantidade: number;
  }[];

  anexos: {
    nome_anexo: string;
    anexo_tipo: string;
    anexo_tamanho: number;
    conteudo_arquivo_base64: string;
  }[];
}

export function getTimesParaManutencao(): Promise<{
  times: { id_time: number; nome_time: string }[];
}> {
  return request("/manutencoes/times");
}

export function getResponsaveisManutencao(): Promise<{
  responsaveis: { id_usuario: number; nome: string }[];
}> {
  return request("/manutencoes/responsaveis");
}

export function createManutencao(
  data: ManutencaoPayload,
): Promise<{
  message: string;
  manutencao: {
    manutencao_id: number;
    status: string;
  };
}> {
  return request("/manutencoes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface Manutencao {
  id: string;
  resumo: string;
  tipo_manutencao: "preventiva" | "corretiva" | "adaptativa" | "evolutiva";
  prioridade: "baixa" | "media" | "alta" | "critica";
  status: string;
  descricao: string;
  data_inicio_problema: string | null;
  responsavel: string | null;
  time: { id: string; nome: string } | null;
  equipamentos: { nome: string; quantidade: number }[];
  anexos: ManutencaoAnexo[];
}

export function getManutencoes(): Promise<{ manutencoes: Manutencao[] }> {
  return request("/manutencoes");
}

export function abrirAnexoManutencao(
  manutencaoId: string,
  anexo: ManutencaoAnexo,
): Promise<void> {
  return abrirAnexoPorCaminho(
    `/manutencoes/${encodeURIComponent(manutencaoId)}/anexos/${encodeURIComponent(anexo.id)}`,
    anexo,
  );
}