import type { RowDataPacket } from "mysql2";

import type { Role, User } from "./users.js";

// Perfis que não pertencem a nenhum time e enxergam tudo da sua área:
//  - gestor: todas as O.S.
//  - comercial: O.S. vinculadas a projetos
//  - suporte: O.S. vinculadas a manutenções
// Os demais perfis (produção, software, implantação, monitoramento) enxergam apenas
// as O.S. direcionadas ao seu time.
export const PERFIS_DE_TIME: Role[] = ["producao", "software", "implantacao", "monitoramento"];

export type StatusItem = "nao_iniciado" | "em_andamento" | "concluido" | "cancelado";

// Status de projeto/manutenção é derivado das suas O.S.:
// sem O.S. = não iniciado | todas concluídas = concluído | demais = em andamento
export function statusDoItem(totalOS: number, osNaoConcluidas: number): StatusItem {
  if (totalOS === 0) return "nao_iniciado";
  if (osNaoConcluidas === 0) return "concluido";
  return "em_andamento";
}

export const SELECT_OS = `
  SELECT o.os_id,
         o.os_titulo,
         o.os_descricao,
         o.os_status,
         o.prioridade,
         o.id_time_responsavel,
         o.projeto_id,
         o.manutencao_id,
         t.nome_time,
         t.responsavel_id AS time_responsavel_id,
         t.departamento,
         c.nome AS criador_nome,
         DATE_FORMAT(o.data_limite, '%Y-%m-%d') AS data_limite,
         DATE_FORMAT(o.data_criacao, '%Y-%m-%d') AS data_criacao
    FROM os o
    LEFT JOIN time t ON t.id_time = o.id_time_responsavel
    LEFT JOIN usuarios c ON c.id_usuario = o.id_criador`;

export function mapOS(o: RowDataPacket) {
  return {
    id: String(o.os_id),
    titulo: o.os_titulo as string,
    descricao: (o.os_descricao as string) ?? "",
    status: o.os_status as string,
    prioridade: o.prioridade as string,
    data_limite: (o.data_limite as string | null) ?? null,
    data_criacao: (o.data_criacao as string | null) ?? null,
    criador: (o.criador_nome as string | null) ?? null,
    departamento: (o.departamento as string | null) ?? null,
    projeto_id: o.projeto_id === null ? null : String(o.projeto_id),
    manutencao_id: o.manutencao_id === null ? null : String(o.manutencao_id),
    time:
      o.id_time_responsavel === null
        ? null
      : {
          id: String(o.id_time_responsavel),
          nome: o.nome_time as string,
          responsavel_id:
            o.time_responsavel_id === null || o.time_responsavel_id === undefined
              ? null
              : String(o.time_responsavel_id),
        },
  };
}

// Condição SQL (alias "o" = tabela os) com as O.S. que o usuário pode ver.
export function filtroVisibilidadeOS(user: User): { sql: string; params: number[] } {
  if (user.role === "gestor") return { sql: "1 = 1", params: [] };
  if (user.role === "comercial") return { sql: "o.projeto_id IS NOT NULL", params: [] };
  if (user.role === "suporte") return { sql: "o.manutencao_id IS NOT NULL", params: [] };
  if (user.time_id === null) return { sql: "1 = 0", params: [] };
  return { sql: "o.id_time_responsavel = ?", params: [Number(user.time_id)] };
}

// Mesma regra do filtro acima, para uma O.S. já carregada.
export function podeVerOS(
  user: User,
  os: { id_time_responsavel: number | null; projeto_id: number | null; manutencao_id: number | null },
): boolean {
  if (user.role === "gestor") return true;
  if (user.role === "comercial") return os.projeto_id !== null;
  if (user.role === "suporte") return os.manutencao_id !== null;
  if (os.id_time_responsavel === null || user.time_id === null) return false;
  return String(os.id_time_responsavel) === String(user.time_id);
}
