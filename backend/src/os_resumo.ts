import { Router } from "express";
import type { RequestHandler } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import { isTimeMonitoramento } from "./os_fluxo.js";
import {
  buildOSStatusEventMessage,
  buildOSStatusNotificationTitle,
  createNotificationsForTime,
} from "./notificacoes.js";
import type { Role, User } from "./users.js";

// =====================================================
// US24 - Resumo das atividades da O.S. (e conclusão da O.S.)
//
// Fluxo: Review -> Verificação -> (monitoramento aprova) -> volta para Review já aprovada
//        -> o LÍDER do time registra o resumo -> a O.S. é concluída.
//
// Registrar o resumo é o que conclui a O.S.: o texto e o status mudam na mesma transação.
// O texto é a contribuição do departamento no relatório final do projeto/manutenção.
//
//   GET /api/os/:osId/resumo  -> { resumo }
//   PUT /api/os/:osId/resumo  -> { message, resumo, os: { id, status } }   body: { resumo }
// =====================================================

export const LIMITE_RESUMO_OS = 500;

export const MENSAGEM_RESUMO_OBRIGATORIO = "O resumo da OS é obrigatório";
export const MENSAGEM_RESUMO_LIMITE = `O resumo pode ter até ${LIMITE_RESUMO_OS} caracteres.`;
export const MENSAGEM_RESUMO_SEM_PERMISSAO =
  "Somente o líder da equipe responsável pode ver e registrar o resumo desta O.S.";
export const MENSAGEM_RESUMO_JA_CONCLUIDA = "Esta O.S. já foi concluída.";
export const MENSAGEM_RESUMO_AGUARDA_APROVACAO =
  "O resumo só pode ser registrado depois que a O.S. for aprovada na verificação do monitoramento.";

type RequireRole = (...roles: Role[]) => RequestHandler;

// A permissão real é "ser o líder do time da O.S."; o requireRole só garante o login.
const TODOS_OS_PERFIS: Role[] = [
  "superusuario",
  "gestor",
  "comercial",
  "suporte",
  "producao",
  "software",
  "implantacao",
  "monitoramento",
];

export type ResultadoValidacaoResumo = { resumo: string } | { erro: string };

// Obrigatório (sem contar espaços nas pontas) e no máximo 500 caracteres.
export function validarResumo(valor: unknown): ResultadoValidacaoResumo {
  const resumo = typeof valor === "string" ? valor.trim() : "";
  if (!resumo) return { erro: MENSAGEM_RESUMO_OBRIGATORIO };
  if (resumo.length > LIMITE_RESUMO_OS) return { erro: MENSAGEM_RESUMO_LIMITE };
  return { resumo };
}

// Somente o líder do time responsável. O superusuário não conclui O.S. (ele só envia para verificação).
export function podeGerenciarResumo(
  user: Pick<User, "id">,
  os: { time_responsavel_id: number | string | null },
): boolean {
  return os.time_responsavel_id != null && String(os.time_responsavel_id) === String(user.id);
}

// O resumo é liberado quando a O.S. está em Review já aprovada pelo monitoramento
// (ou, sem verificação, quando é uma O.S. do próprio time de monitoramento).
export function resumoLiberado(status: string, aprovadaNaVerificacao: boolean, timeMonitoramento: boolean): boolean {
  return status === "review" && (aprovadaNaVerificacao || timeMonitoramento);
}

// null = pode registrar; senão, o motivo (409).
export function motivoResumoBloqueado(
  status: string,
  aprovadaNaVerificacao: boolean,
  timeMonitoramento: boolean,
): string | null {
  if (status === "concluida") return MENSAGEM_RESUMO_JA_CONCLUIDA;
  return resumoLiberado(status, aprovadaNaVerificacao, timeMonitoramento) ? null : MENSAGEM_RESUMO_AGUARDA_APROVACAO;
}

export type AprovacaoVerificacao = { usuario: string | null; data: string };

// A O.S. está "aprovada e aguardando o resumo" quando a última verificação dela foi uma aprovação.
// (O status só sai de Review pelo próprio resumo, então a última verificação continua valendo.)
export async function buscarAprovacaoPendente(
  osId: number | string,
  db: Pick<typeof pool, "execute"> = pool,
): Promise<AprovacaoVerificacao | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT v.resultado, u.nome AS usuario_nome,
            DATE_FORMAT(v.data_criacao, '%d/%m/%Y %H:%i') AS data_verificacao
       FROM os_verificacoes v
       LEFT JOIN usuarios u ON u.id_usuario = v.usuario_id
      WHERE v.os_id = ?
      ORDER BY v.data_criacao DESC, v.verificacao_id DESC
      LIMIT 1`,
    [osId],
  );
  const ultima = rows[0];
  if (!ultima || ultima.resultado !== "aprovada") return null;
  return { usuario: (ultima.usuario_nome as string | null) ?? null, data: ultima.data_verificacao as string };
}

// Cria a coluna os.os_resumo em bancos já existentes (em banco novo o script.sql já a cria).
export async function ensureOsResumoSchema(): Promise<void> {
  const [colunas] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM os LIKE 'os_resumo'");
  if (!colunas.length) {
    await pool.query(`ALTER TABLE os ADD COLUMN os_resumo VARCHAR(${LIMITE_RESUMO_OS}) NULL AFTER os_descricao`);
  }
}

async function buscarOS(osId: string): Promise<RowDataPacket | undefined> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT o.os_id, o.os_titulo, o.os_status, o.os_resumo, o.id_time_responsavel,
            t.nome_time, t.departamento, t.responsavel_id AS time_responsavel_id,
            m.responsavel_id AS manutencao_responsavel_id,
            COALESCE(p.vendedor_id, p.responsavel_id) AS projeto_responsavel_id
       FROM os o
       LEFT JOIN time t ON t.id_time = o.id_time_responsavel
       LEFT JOIN manutencoes m ON m.manutencao_id = o.manutencao_id
       LEFT JOIN projetos p ON p.projeto_id = o.projeto_id
      WHERE o.os_id = ?
      LIMIT 1`,
    [osId],
  );
  return rows[0];
}

export function createOsResumoRouter(requireRole: RequireRole): Router {
  const router = Router();

  router.get("/:osId/resumo", requireRole(...TODOS_OS_PERFIS), async (req, res) => {
    const user = res.locals.user as User;
    const osId = String(req.params.osId);

    if (!/^\d+$/.test(osId)) {
      return res.status(404).json({ message: "Ordem de serviço não encontrada." });
    }

    try {
      const os = await buscarOS(osId);
      if (!os) {
        return res.status(404).json({ message: "Ordem de serviço não encontrada." });
      }
      if (!podeGerenciarResumo(user, { time_responsavel_id: os.time_responsavel_id as number | null })) {
        return res.status(403).json({ message: MENSAGEM_RESUMO_SEM_PERMISSAO });
      }

      return res.json({ resumo: (os.os_resumo as string | null) ?? "" });
    } catch (error) {
      console.error("Erro ao buscar resumo da O.S.:", error);
      return res.status(500).json({ message: "Não foi possível carregar o resumo da ordem de serviço." });
    }
  });

  // Registra o resumo e conclui a O.S. (mesma transação).
  router.put("/:osId/resumo", requireRole(...TODOS_OS_PERFIS), async (req, res) => {
    const user = res.locals.user as User;
    const osId = String(req.params.osId);

    if (!/^\d+$/.test(osId)) {
      return res.status(404).json({ message: "Ordem de serviço não encontrada." });
    }

    try {
      const os = await buscarOS(osId);
      if (!os) {
        return res.status(404).json({ message: "Ordem de serviço não encontrada." });
      }

      // Permissão antes da validação do conteúdo, para não revelar regras a quem não pode editar.
      if (!podeGerenciarResumo(user, { time_responsavel_id: os.time_responsavel_id as number | null })) {
        return res.status(403).json({ message: MENSAGEM_RESUMO_SEM_PERMISSAO });
      }

      const validacao = validarResumo((req.body ?? {}).resumo);
      if ("erro" in validacao) {
        return res.status(400).json({ message: validacao.erro });
      }

      const status = os.os_status as string;
      const aprovada = status === "review" ? Boolean(await buscarAprovacaoPendente(osId)) : false;
      const bloqueio = motivoResumoBloqueado(status, aprovada, isTimeMonitoramento(os.departamento as string | null));
      if (bloqueio) {
        return res.status(409).json({ message: bloqueio });
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // A condição de status evita concluir duas vezes (ou concluir uma O.S. que mudou de etapa).
        const [resultado] = await connection.execute<ResultSetHeader>(
          "UPDATE os SET os_resumo = ?, os_status = 'concluida' WHERE os_id = ? AND os_status = 'review'",
          [validacao.resumo, osId],
        );
        if (!resultado.affectedRows) {
          await connection.rollback();
          return res.status(409).json({ message: MENSAGEM_RESUMO_AGUARDA_APROVACAO });
        }

        const [eventRows] = await connection.execute<RowDataPacket[]>(
          "SELECT DATE_FORMAT(CURRENT_TIMESTAMP, '%d/%m/%Y %H:%i:%s') AS data_evento",
        );

        // Aviso de conclusão: time, líder e responsáveis pelo projeto/manutenção.
        await createNotificationsForTime(connection, {
          titulo: buildOSStatusNotificationTitle("concluida"),
          mensagem: buildOSStatusEventMessage(
            os.os_id as number,
            os.os_titulo as string,
            "concluida",
            (os.nome_time as string | undefined) ?? "time responsável",
            user.name,
            (eventRows[0]?.data_evento as string | undefined) ?? "data não informada",
          ),
          timeId: os.id_time_responsavel as number | null,
          osId: os.os_id as number,
          usuarioOrigemId: user.id,
          incluirResponsavelDoTimeComoDestino: true,
          usuariosDestinoExtras: [
            os.manutencao_responsavel_id as number | null,
            os.projeto_responsavel_id as number | null,
          ],
        });

        await connection.commit();
        return res.json({
          message: "Resumo registrado e O.S. concluída com sucesso.",
          resumo: validacao.resumo,
          os: { id: String(os.os_id), status: "concluida" },
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Erro ao registrar resumo da O.S.:", error);
      return res.status(500).json({ message: "Não foi possível registrar o resumo da ordem de serviço." });
    }
  });

  return router;
}