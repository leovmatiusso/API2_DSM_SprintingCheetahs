import { Router } from "express";
import type { RequestHandler } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import { createNotificationsForTime } from "./notificacoes.js";
import type { Role, User } from "./users.js";

// =====================================================
// Exclusão de O.S.
//
//   DELETE /api/os/:osId  -> { message }
//
// Quem pode:
//   - gestor e superusuário: qualquer O.S.
//   - comercial: O.S. de projeto
//   - suporte: O.S. de manutenção
//   - líder/responsável: O.S. do próprio time
//
// Anexos, equipamentos e verificações da O.S. saem junto (ON DELETE CASCADE do banco).
// As notificações antigas ficam, só que sem o vínculo com a O.S. (ON DELETE SET NULL).
// =====================================================

type RequireRole = (...roles: Role[]) => RequestHandler;

export type OrigemOS = "projeto" | "manutencao";

const PERFIS_QUE_EXCLUEM: Role[] = ["gestor", "superusuario", "comercial", "suporte"];

export const MENSAGEM_EXCLUSAO_SEM_PERMISSAO = "Você não tem permissão para excluir esta O.S.";
export const MENSAGEM_EXCLUSAO_CONCLUIDA =
  "Uma O.S. concluída não pode ser excluída, pois já faz parte do histórico do projeto/manutenção.";
export const MENSAGEM_EXCLUSAO_VERIFICACAO = "A O.S. não pode ser excluída durante a verificação.";
export const MENSAGEM_EXCLUSAO_ORIGEM_CONCLUIDA =
  "Não é possível excluir a O.S. de um projeto ou manutenção que já foi concluído.";

export function origemDaOS(os: { projeto_id: number | string | null; manutencao_id: number | string | null }): OrigemOS {
  return os.projeto_id != null ? "projeto" : "manutencao";
}

export function podeExcluirOS(role: Role, responsavelDoTime = false): boolean {
  return responsavelDoTime || PERFIS_QUE_EXCLUEM.includes(role);
}

// null = pode excluir; senão, o motivo (409).
export function motivoExclusaoBloqueada(statusOS: string, origemConcluida: boolean): string | null {
  if (statusOS === "concluida") return MENSAGEM_EXCLUSAO_CONCLUIDA;
  if (statusOS === "verificacao") return MENSAGEM_EXCLUSAO_VERIFICACAO;
  if (origemConcluida) return MENSAGEM_EXCLUSAO_ORIGEM_CONCLUIDA;
  return null;
}

function escapeHtml(valor: string): string {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// A coluna de mensagem das notificações aceita 200 caracteres: o título é encurtado até caber.
export function montarMensagemExclusao(osTitulo: string, autor: string): string {
  const autorHtml = escapeHtml(autor.slice(0, 40));
  let titulo = osTitulo.trim();
  for (;;) {
    const texto = titulo === osTitulo.trim() ? titulo : `${titulo}…`;
    const mensagem = `A ordem de serviço <strong>${escapeHtml(texto)}</strong> foi excluída por <strong>${autorHtml}</strong>.`;
    if (mensagem.length <= 200 || titulo.length <= 1) return mensagem;
    titulo = titulo.slice(0, Math.max(1, titulo.length - 10));
  }
}

export function createOsExclusaoRouter(requireRole: RequireRole): Router {
  const router = Router();

  router.delete(
    "/:osId",
    requireRole("gestor", "comercial", "suporte", "superusuario", "producao", "software", "implantacao", "monitoramento"),
    async (req, res) => {
    const user = res.locals.user as User;
    const osId = String(req.params.osId);

    if (!/^\d+$/.test(osId)) {
      return res.status(404).json({ message: "Ordem de serviço não encontrada." });
    }

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT o.os_id, o.os_titulo, o.os_status, o.id_time_responsavel, o.projeto_id, o.manutencao_id,
                t.responsavel_id AS time_responsavel_id,
                p.status AS projeto_status, m.status AS manutencao_status
           FROM os o
           LEFT JOIN time t ON t.id_time = o.id_time_responsavel
           LEFT JOIN projetos p ON p.projeto_id = o.projeto_id
           LEFT JOIN manutencoes m ON m.manutencao_id = o.manutencao_id
          WHERE o.os_id = ?
          LIMIT 1`,
        [osId],
      );
      const os = rows[0];
      if (!os) {
        return res.status(404).json({ message: "Ordem de serviço não encontrada." });
      }

      const origem = origemDaOS({
        projeto_id: os.projeto_id as number | null,
        manutencao_id: os.manutencao_id as number | null,
      });
      const responsavelDoTime =
        os.time_responsavel_id != null && String(os.time_responsavel_id) === String(user.id);
      if (!podeExcluirOS(user.role, responsavelDoTime)) {
        return res.status(403).json({ message: MENSAGEM_EXCLUSAO_SEM_PERMISSAO });
      }

      const origemConcluida =
        origem === "projeto" ? os.projeto_status === "concluido" : os.manutencao_status === "concluida";
      const bloqueio = motivoExclusaoBloqueada(os.os_status as string, origemConcluida);
      if (bloqueio) {
        return res.status(409).json({ message: bloqueio });
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // A condição de status evita excluir uma O.S. que acabou de ser concluída ou enviada para verificação.
        const [resultado] = await connection.execute<ResultSetHeader>(
          "DELETE FROM os WHERE os_id = ? AND os_status NOT IN ('concluida', 'verificacao')",
          [osId],
        );
        if (!resultado.affectedRows) {
          await connection.rollback();
          return res.status(409).json({ message: "A O.S. mudou de etapa e não pode mais ser excluída." });
        }

        // Aviso ao time e ao líder (sem vínculo com a O.S., que já não existe).
        if (os.id_time_responsavel != null) {
          await createNotificationsForTime(connection, {
            titulo: "Ordem de Serviço excluída",
            mensagem: montarMensagemExclusao(os.os_titulo as string, user.name),
            timeId: os.id_time_responsavel as number,
            osId: null,
            usuarioOrigemId: user.id,
            incluirResponsavelDoTimeComoDestino: true,
          });
        }

        await connection.commit();
        return res.json({ message: "Ordem de serviço excluída com sucesso." });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Erro ao excluir O.S.:", error);
      return res.status(500).json({ message: "Não foi possível excluir a ordem de serviço." });
    }
    },
  );

  return router;
}
