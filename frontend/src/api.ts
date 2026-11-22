import type { LoginResponse, Role, Time, User } from "./types";
import { getToken, logout as clearSession } from "./auth";

const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/api"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

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
    throw new ApiError(data?.message ?? "Erro na requisição.", response.status);
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

export interface HistoricoAtividadeItem {
  historico_id: number;
  os_id: number;
  os_titulo: string;
  tipo_acao: "criado" | "atualizado" | "deletado";
  os_status: string;
  id_time_responsavel: number | null;
  nome_time: string | null;
  usuario_id: number | null;
  usuario_email: string | null;
  data_historico: string;
  data_limite: string;
}

export interface RegistroHistorico {
  historico_id: number;
  tabela: string;
  registro_id: string;
  tipo_acao: "criado" | "atualizado" | "deletado";
  dados: Record<string, unknown> | string;
  usuario_id: number | null;
  usuario_email: string | null;
  data_historico: string;
}

export function getRegistrosHistorico(data?: string): Promise<{ registros: RegistroHistorico[] }> {
  const query = data ? `?data=${encodeURIComponent(data)}` : "";
  return request<{ registros: RegistroHistorico[] }>(`/historico/registros${query}`);
}

export function getHistorico(data?: string): Promise<{ historico: HistoricoAtividadeItem[] }> {
  const path = data
    ? `/historico-filtro?data=${encodeURIComponent(data)}`
    : "/historico";
  return request<{ historico: HistoricoAtividadeItem[] }>(path);
}

export function getHistoricoOS(osId: string): Promise<{ historico: HistoricoAtividadeItem[] }> {
  return request<{ historico: HistoricoAtividadeItem[] }>(`/os/${encodeURIComponent(osId)}/historico`);
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
  // exatamente um dos dois deve ser informado
  projeto_id?: string;
  manutencao_id?: string;
  equipamentos?: { nome_equipamento: string; quantidade: number }[];
  anexos?: {
    nome_anexo: string;
    anexo_tipo: string;
    anexo_tamanho: number;
    conteudo_arquivo_base64: string;
  }[];
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

export function getNotificacoes(): Promise<{
  notificacoes: Array<{
    id: string;
    titulo: string;
    mensagem: string;
    time_id: string | null;
    os_id: string | null;
    projeto_id: string | null;
    projeto_nome: string | null;
    manutencao_id: string | null;
    manutencao_resumo: string | null;
    os_titulo: string | null;
    os_status: string | null;
    time_nome: string | null;
    usuario_origem_id: string | null;
    usuario_origem_nome: string | null;
    data_criacao: string;
    lida: boolean;
  }>;
}> {
  return request<{ notificacoes: Array<{ id: string; titulo: string; mensagem: string; time_id: string | null; os_id: string | null; projeto_id: string | null; projeto_nome: string | null; manutencao_id: string | null; manutencao_resumo: string | null; os_titulo: string | null; os_status: string | null; time_nome: string | null; usuario_origem_id: string | null; usuario_origem_nome: string | null; data_criacao: string; lida: boolean; }> }>("/notificacoes");
}

export function getNotificacoesNaoLidas(): Promise<{ total: number }> {
  return request<{ total: number }>("/notificacoes/nao-lidas/count");
}

export function marcarNotificacaoComoLida(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/notificacoes/${encodeURIComponent(id)}/ler`, {
    method: "PATCH",
  });
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
  data_limite: string;
  tipo_sistema: string;
  vendedor_nome: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  descricao?: string;
  anexos: {
    nome_anexo: string;
    anexo_tipo: string;
    anexo_tamanho: number;
    conteudo_arquivo_base64: string;
  }[];
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

export type StatusItem = "nao_iniciado" | "em_andamento" | "concluido" | "cancelado";
export type StatusProjeto = "aberto" | "em_andamento" | "concluido" | "cancelado";

// Dados do ticket (listagem)
export interface ProjetoResumo {
  id: string;
  nome: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  responsavel: string | null;
  status: StatusProjeto;
}

// Dados da tela expandida
export interface Projeto extends ProjetoResumo {
  tipo_sistema: string;
  descricao: string;
  data_assinatura_contrato: string | null;
  data_vencimento_contrato: string | null;
  data_limite: string | null;
  vendedor: string | null;
  anexos: ProjetoAnexo[];
  ordens: OrdemServicoResumo[];
}

export function getProjetos(): Promise<{ projetos: ProjetoResumo[] }> {
  return request("/projetos");
}

export function getProjeto(id: string): Promise<{ projeto: Projeto }> {
  return request(`/projetos/${encodeURIComponent(id)}`);
}

export function atualizarStatusProjeto(id: string, status: StatusProjeto): Promise<{ message: string }> {
  return request(`/projetos/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
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

  projeto_id?: string | null;

  data_limite: string;

  data_inicio_problema: string;

  prioridade:
    | "baixa"
    | "media"
    | "alta"
    | "critica";

  descricao_situacao: string;

  anexos: {
    nome_anexo: string;
    anexo_tipo: string;
    anexo_tamanho: number;
    conteudo_arquivo_base64: string;
  }[];
}

export function getProjetosParaManutencao(): Promise<{
  projetos: { id_projeto: number; nome: string }[];
}> {
  return request("/manutencoes/projetos");
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

// Dados do ticket (listagem)
export interface ManutencaoResumo {
  id: string;
  resumo: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  responsavel: string | null;
  status_manutencao: "aberta" | "em_andamento" | "concluida" | "cancelada";
  status: StatusItem;
}

// Dados da tela expandida
export interface Manutencao extends ManutencaoResumo {
  tipo_manutencao: "preventiva" | "corretiva" | "adaptativa" | "evolutiva";
  descricao: string;
  data_inicio_problema: string | null;
  data_limite: string | null;
  projeto: { id: string; nome: string } | null;
  anexos: ManutencaoAnexo[];
  ordens: OrdemServicoResumo[];
}

export function getManutencoes(): Promise<{ manutencoes: ManutencaoResumo[] }> {
  return request("/manutencoes");
}

export function getManutencao(id: string): Promise<{ manutencao: Manutencao }> {
  return request(`/manutencoes/${encodeURIComponent(id)}`);
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

// =====================================================
// RELATÓRIO DE FINAL DE PROJETO/MANUTENÇÃO
// =====================================================

function nomeArquivoRelatorio(nome: string): string {
  const limpo = nome.replace(/[\\/:*?"<>|]/g, "").trim()
  return `Relatório - ${limpo || "sem título"}.pdf`
}

async function baixarPdfPorCaminho (
  caminho: string,
  nomeArquivo: string,
): Promise<void> {
  const token = getToken()
  const response = await fetch(`${API_URL}${caminho}`, {
    headers: token ? { Authorization: `Bearer ${token}`} : {}
  })

  if (!response.ok) {
    let mensagem = "Não foi possível gerar o relatório.";
    try {
      mensagem = (await response.json())?.message ?? mensagem;
    } catch {
      /* resposta sem JSON */
    }
    throw new ApiError(mensagem, response.status);
  }

  const blob = new Blob([await response.blob()], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function baixarRelatorioProjeto(id: string, nome: string): Promise<void> {
  return baixarPdfPorCaminho(
    `/projetos/${encodeURIComponent(id)}/relatorio`,
    nomeArquivoRelatorio(nome),
  );
}

export function baixarRelatorioManutencao(id: string, resumo: string): Promise<void> {
  return baixarPdfPorCaminho(
    `/manutencoes/${encodeURIComponent(id)}/relatorio`,
    nomeArquivoRelatorio(resumo),
  );
}

// =====================================================
// ORDENS DE SERVIÇO (listagem, detalhe e conclusão)
// =====================================================

export type OrdemStatus =
  | "aberta"
  | "em andamento"
  | "concluida"
  | "teste"
  | "bloqueado"
  | "review"
  | "verificacao";

export interface OrdemServicoResumo {
  id: string;
  titulo: string;
  descricao: string;
  status: OrdemStatus;
  prioridade: "baixa" | "media" | "alta" | "critica";
  data_limite: string | null;
  data_criacao: string | null;
  criador: string | null;
  departamento: string | null;
  projeto_id: string | null;
  manutencao_id: string | null;
  time: { id: string; nome: string; responsavel_id?: string | null } | null;
}

export interface PedidoPai {
  tipo: "projeto" | "manutencao";
  id: string;
  titulo: string;
  data_limite: string | null;
}

export interface OrdemServicoDetalhe extends OrdemServicoResumo {
  pedido_pai: PedidoPai | null;
  equipamentos: { nome: string; quantidade: number }[];
  anexos: ProjetoAnexo[];
  ultima_reprovacao: {
    justificativa: string;
    usuario: string | null;
    data: string;
  } | null;
  // Aprovada pelo monitoramento e de volta ao time em Review, aguardando o resumo do líder.
  aprovada_verificacao: {
    usuario: string | null;
    data: string;
  } | null;
}

export interface RelatorioOS {
  id: string;
  nome: string;
  tipo: "application/pdf";
  tamanho: number;
  data_envio: string;
}

export function getOrdens(): Promise<{ ordens: OrdemServicoResumo[] }> {
  return request("/os");
}

export interface DashboardResumo {
  projetos: number;
  ordens: {
    abertas: number;
    andamento: number;
    alerta: number;
    concluidas: number;
    total: number;
    emTeste: number;
    porDepartamento: {
      producao: number;
      software: number;
      monitoramento: number;
      implantacao: number;
    };
      porPrioridade: { baixa: number; media: number; alta: number; critica: number };
  };
  manutencoes: {
    total: number;
    abertas: number;
    andamento: number;
    alerta: number;
  };
}

export function getDashboardResumo(): Promise<DashboardResumo> {
  return request("/dashboard");
}

export function getOrdem(id: string): Promise<{ ordem: OrdemServicoDetalhe }> {
  return request(`/os/${encodeURIComponent(id)}`);
}

export function abrirAnexoOS(osId: string, anexo: ProjetoAnexo): Promise<void> {
  return abrirAnexoPorCaminho(
    `/os/${encodeURIComponent(osId)}/anexos/${encodeURIComponent(anexo.id)}`,
    anexo,
  );
}

export function getRelatoriosOS(osId: string): Promise<{ relatorios: RelatorioOS[] }> {
  return request(`/os/${encodeURIComponent(osId)}/relatorios`);
}

export function enviarRelatorioOS(osId: string, arquivo: File): Promise<{
  message: string;
  relatorio: { id: string; nome: string };
}> {
  const formData = new FormData();
  formData.append("arquivo", arquivo);
  return request(`/os/${encodeURIComponent(osId)}/relatorios`, {
    method: "POST",
    body: formData,
  });
}

export async function abrirRelatorioOS(
  osId: string,
  relatorio: RelatorioOS,
  baixar = false,
): Promise<void> {
  const caminho = `/os/${encodeURIComponent(osId)}/relatorios/${encodeURIComponent(relatorio.id)}`;
  const token = getToken();
  const preview = baixar ? null : window.open("about:blank", "_blank");
  if (preview) preview.opener = null;

  try {
    const response = await fetch(`${API_URL}${caminho}${baixar ? "?download=true" : ""}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      let mensagem = "Não foi possível abrir o relatório.";
      try {
        mensagem = (await response.json())?.message ?? mensagem;
      } catch {
        // A resposta pode não conter JSON.
      }
      throw new Error(mensagem);
    }

    const url = URL.createObjectURL(await response.blob());
    if (preview) {
      preview.location.href = url;
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.download = relatorio.nome;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    preview?.close();
    throw error;
  }
}

export function atualizarStatusOS(
  id: number | string,
  status: string,
): Promise<any> {
  return request(`/os/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    body: JSON.stringify({ os_status: status }),
  });
}

export function registrarVerificacaoOS(
  id: number | string,
  resultado: "aprovada" | "reprovada",
  justificativa?: string,
): Promise<{ message: string; os: { id: string; status: OrdemStatus } }> {
  return request(`/os/${encodeURIComponent(id)}/verificacao`, {
    method: "POST",
    body: JSON.stringify({ resultado, justificativa }),
  });
}

// Resumo das atividades da O.S. (US24): somente o líder do time responsável.
// Registrar o resumo conclui a O.S. (depois que o monitoramento a aprovou).
export function getResumoOS(id: number | string): Promise<{ resumo: string }> {
  return request(`/os/${encodeURIComponent(id)}/resumo`);
}

export function registrarResumoOS(
  id: number | string,
  resumo: string,
): Promise<{ message: string; resumo: string; os: { id: string; status: OrdemStatus } }> {
  return request(`/os/${encodeURIComponent(id)}/resumo`, {
    method: "PUT",
    body: JSON.stringify({ resumo }),
  });
}

export function atualizarOrdemServico(
  id: string | number,
  data: {
    os_titulo?: string;
    os_descricao?: string;
    prioridade?: "baixa" | "media" | "alta" | "critica";
    data_limite?: string;
    id_time_responsavel?: string | number;
    equipamentos?: { nome_equipamento: string; quantidade: number }[];
  }
): Promise<{ message: string }> {
  return request(`/os/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function atualizarProjeto(
  id: string,
  dados: Partial<Projeto>,
) {
  return request(`/projetos/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}
export function atualizarManutencao(
  id: string | number,
  data: {
    resumo?: string;
    tipo_manutencao?: "preventiva" | "corretiva" | "adaptativa" | "evolutiva";
    projeto_id?: string | number | null;
    id_time_responsavel?: string | number;
    data_limite?: string;
    data_inicio_problema?: string;
    prioridade?: "baixa" | "media" | "alta" | "critica";
    status_manutencao?: string;
    descricao_situacao?: string;
  }
): Promise<{ message: string; manutencao: Manutencao }> {
  return request(`/manutencoes/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
