import { Router } from "express";
import type { RequestHandler } from "express";
import type { RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import type { Role, User } from "./users.js";

type RequireRole = (...roles: Role[]) => RequestHandler;

const PERFIS_COM_DASHBOARD: Role[] = [
  "gestor",
  "comercial",
  "suporte",
  "producao",
  "software",
  "implantacao",
];

export function createDashboardRouter(requireRole: RequireRole): Router {
  const router = Router();

  router.get("/", requireRole(...PERFIS_COM_DASHBOARD), async (_req, res) => {
    const user = res.locals.user as User;

    try {
      const paramsOS: number[] = [];
      const paramsProjeto: number[] = [];
      const paramsManutencao: number[] = [];
      let filtroOS = "";
      let filtroProjetos = "";
      let filtroManutencoes = "";

      if (user.role !== "gestor") {
        if (user.time_id !== null) {
          const timeId = Number(user.time_id);
          filtroOS = "WHERE o.id_time_responsavel = ?";
          paramsOS.push(timeId);

          if (user.role !== "comercial") {
            filtroProjetos = "WHERE p.time_id = ?";
            paramsProjeto.push(timeId);
          }
          if (user.role !== "suporte") {
            filtroManutencoes = "WHERE m.time_id = ?";
            paramsManutencao.push(timeId);
          }
        } else {
          // OS e registros de outros times não ficam visíveis para usuário sem time.
          filtroOS = "WHERE 1 = 0";
          if (user.role !== "comercial") filtroProjetos = "WHERE 1 = 0";
          if (user.role !== "suporte") filtroManutencoes = "WHERE 1 = 0";
        }
      }

      const [osRows] = await pool.execute<RowDataPacket[]>(
        `SELECT o.os_id, o.os_titulo, o.os_descricao, o.os_status, o.prioridade,
                o.id_time_responsavel,
                DATE_FORMAT(o.data_limite, '%Y-%m-%d') AS data_limite,
                DATE_FORMAT(o.data_criacao, '%Y-%m-%d') AS data_criacao,
                t.nome_time, t.departamento
           FROM os o
           LEFT JOIN time t ON t.id_time = o.id_time_responsavel
           ${filtroOS}
          ORDER BY o.data_criacao DESC, o.os_id DESC`,
        paramsOS,
      );

      const [projetoRows] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM projetos p ${filtroProjetos}`,
        paramsProjeto,
      );

      const [manutencaoRows] = await pool.execute<RowDataPacket[]>(
        `SELECT m.status, COUNT(*) AS total
           FROM manutencoes m
           ${filtroManutencoes}
          GROUP BY m.status`,
        paramsManutencao,
      );

      const os = osRows.map((row) => ({
        id: String(row.os_id),
        criador: null,
        titulo: row.os_titulo as string,
        descricao: (row.os_descricao as string | null) ?? "",
        status: row.os_status as string,
        prioridade: row.prioridade as string,
        data_limite: (row.data_limite as string | null) ?? null,
        data_criacao: (row.data_criacao as string | null) ?? null,
        departamento: (row.departamento as string | null) ?? null,
        time: row.id_time_responsavel === null ? null : { id: String(row.id_time_responsavel), nome: row.nome_time as string },
      }));
      const contagemManutencoes = new Map(
        manutencaoRows.map((row) => [row.status as string, Number(row.total)]),
      );
      const abertas = contagemManutencoes.get("aberta") ?? 0;
      const manutencoesAndamento = contagemManutencoes.get("em andamento") ?? 0;
      const porDepartamento = {
        producao: os.filter((ordem) => ordem.departamento?.toLowerCase().includes("produção") || ordem.departamento?.toLowerCase().includes("producao")).length,
        software: os.filter((ordem) => ordem.departamento?.toLowerCase().includes("software")).length,
        monitoramento: os.filter((ordem) => ordem.departamento?.toLowerCase().includes("monitoramento")).length,
        implantacao: os.filter((ordem) => ordem.departamento?.toLowerCase().includes("implantação") || ordem.departamento?.toLowerCase().includes("implantacao")).length,
      };

      return res.json({
        projetos: Number(projetoRows[0]?.total ?? 0),
        ordens: {
          abertas: os.filter((ordem) => ordem.status === "aberta").length,
          andamento: os.filter((ordem) => ordem.status === "em andamento").length,
          alerta: os.filter((ordem) => ordem.status === "bloqueado" || ordem.status === "review").length,
          concluidas: os.filter((ordem) => ordem.status === "concluida").length,
          emTeste: os.filter((ordem) => ordem.status === "teste").length,
          total: os.length,
          porDepartamento,
          recentes: os.slice(0, 5),
        },
        manutencoes: {
          total: manutencaoRows.reduce((total, row) => total + Number(row.total), 0),
          abertas: abertas,
          andamento: manutencoesAndamento,
          alerta: contagemManutencoes.get("cancelada") ?? 0,
        },
      });
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      return res.status(500).json({ message: "Não foi possível carregar os dados do dashboard." });
    }
  });

  return router;
}
