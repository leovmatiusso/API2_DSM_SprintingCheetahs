import fs from "node:fs/promises";
import path from "node:path";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { pool } from "./db.js";

export type ReportItem = {
  tipo: "projeto" | "manutencao";
  tipoMinusculo: "projeto" | "manutencao";
  titulo: string;
  responsavel: string;
  dataInicio: string;
  dataConclusao: string;
  dataEmissao: string;
  descricao: string;
  contrato: { assinatura: string | null; vencimento: string | null } | null;
  categoria: string;
  equipamentos: { nome: string; quantidade: number }[];
  departamentos: { nome: string; ordens: { descricao: string; resumo: string }[] }[];
};

function formatarData(valor: unknown): string | null {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(valor)) return null;
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return null;
  return `${dia}/${mes}/${ano}`;
}

function hojePtBr(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderTemplate(template: string, item: ReportItem): string {
  let html = template;
  const replacements: Record<string, string> = {
    tipo: item.tipo === "projeto" ? "Projeto" : "Manutenção",
    tipoMinusculo: item.tipoMinusculo,
    titulo: escapeHtml(item.titulo),
    responsavel: escapeHtml(item.responsavel),
    dataInicio: item.dataInicio,
    dataConclusao: item.dataConclusao,
    dataEmissao: item.dataEmissao,
    descricao: escapeHtml(item.descricao),
    categoria: escapeHtml(item.categoria),
    "contrato.assinatura": escapeHtml(item.contrato?.assinatura ?? "Não informada"),
    "contrato.vencimento": escapeHtml(item.contrato?.vencimento ?? "Não informado"),
  };
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }

  html = html.replace(
    /{{#if contrato}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g,
    item.contrato ? "$1" : "$2",
  );

  html = html.replace(
    /{{#each equipamentos}}([\s\S]*?){{\/each}}/g,
    item.equipamentos.length
      ? item.equipamentos.map((e) =>
          "$1".replaceAll("{{nome}}", escapeHtml(e.nome)).replaceAll("{{quantidade}}", String(e.quantidade)),
        ).join("")
      : "<li>Nenhum equipamento utilizado.</li>",
  );

  html = html.replace(
    // O bloco de departamentos contém outro {{#each}} (ordens): o padrão precisa passar pelo
    // {{/each}} interno para terminar no {{/each}} que realmente fecha os departamentos.
    /{{#each departamentos}}([\s\S]*?{{#each ordens}}[\s\S]*?{{\/each}}[\s\S]*?){{\/each}}/g,
    (_match, departamentoTemplate: string) => {
      if (!item.departamentos.length) {
        return '<div class="empty"><p>Este departamento não teve contribuição.</p></div>';
      }
      return item.departamentos.map((departamento) => {
        let rendered = departamentoTemplate.replaceAll("{{nome}}", escapeHtml(departamento.nome));
        rendered = rendered.replace(
          /{{#each ordens}}([\s\S]*?){{\/each}}/g,
          (_ordensMatch, ordemTemplate: string) =>
            departamento.ordens.length
              ? departamento.ordens.map((ordem) =>
                  ordemTemplate
                    .replaceAll("{{ordem.descricao}}", () => escapeHtml(ordem.descricao))
                    .replaceAll("{{ordem.resumo}}", () => escapeHtml(ordem.resumo))
                    // Compatibilidade com templates antigos que usam apenas {{resumo}}.
                    .replaceAll("{{resumo}}", () => escapeHtml(ordem.resumo)),
                ).join("")
              : '<li>Este departamento não teve contribuição.</li>',
        );
        return rendered;
      }).join("");
    },
  );

  return html.replace(/{{[^}]+}}/g, "");
}

async function gerarPdfComPlaywright(html: string): Promise<Buffer | null> {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });
      await page.emulateMedia({ media: "print" });
      return Buffer.from(await page.pdf({
        format: "A4",
        printBackground: true,
      }));
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.warn("Playwright indisponível; usando PDF de fallback:", error instanceof Error ? error.message : error);
    return null;
  }
}

async function gerarPdfFallback(item: ReportItem): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let page = pdf.addPage([595.28, 841.89]);
  let y = 800;
  const write = (text: string, size = 11) => {
    if (y < 50) {
      page = pdf.addPage([595.28, 841.89]);
      y = 800;
    }
    page.drawText(text.slice(0, 180), { x: 50, y, size, font, color: rgb(0.12, 0.25, 0.55) });
    y -= size + 8;
  };
  write(`Relatorio - ${item.tipo === "projeto" ? "Projeto" : "Manutencao"}`, 18);
  write(item.titulo, 14);
  write(`Responsavel: ${item.responsavel}`);
  write(`Inicio: ${item.dataInicio} | Conclusao: ${item.dataConclusao}`);
  write(`Descricao: ${item.descricao}`);
  write(`Categoria: ${item.categoria}`);
  write("Equipamentos:");
  for (const equipamento of item.equipamentos) write(`- ${equipamento.nome}: ${equipamento.quantidade}`);
  if (!item.equipamentos.length) write("- Nenhum equipamento utilizado.");
  write("Departamentos:");
  for (const departamento of item.departamentos) {
    write(`- ${departamento.nome}`);
    for (const ordem of departamento.ordens) {
      write(`  Descricao: ${ordem.descricao}`);
      write(`  Resumo: ${ordem.resumo}`);
    }
    if (!departamento.ordens.length) write("  Este departamento nao teve contribuicao.");
  }
  return Buffer.from(await pdf.save());
}

export async function gerarPdfRelatorio(item: ReportItem): Promise<Buffer> {
  const templatePath = process.env.REPORT_TEMPLATE_PATH
    ? path.resolve(process.env.REPORT_TEMPLATE_PATH)
    : path.resolve(process.cwd(), "src", "templates", "report-template.html");
  let html: string;
  try {
    const template = await fs.readFile(templatePath, "utf8");
    html = renderTemplate(template, item);
  } catch {
    html = `<!doctype html><html><head><style>
      body{font-family:Inter,Arial,sans-serif;color:#1f2937;padding:32px}
      h1{color:#224b95} section{break-after-page}
    </style></head><body><h1>${escapeHtml(item.tipo)} - ${escapeHtml(item.titulo)}</h1>
    <p><strong>Responsável:</strong> ${escapeHtml(item.responsavel)}</p>
    <p><strong>Período:</strong> ${item.dataInicio} a ${item.dataConclusao}</p>
    <p>${escapeHtml(item.descricao)}</p></body></html>`;
  }
  return (await gerarPdfComPlaywright(html)) ?? gerarPdfFallback(item);
}

async function buscarOrdensVinculadas(
  tipo: "projeto" | "manutencao",
  id: string,
): Promise<RowDataPacket[]> {
  const coluna = tipo === "projeto" ? "o.projeto_id" : "o.manutencao_id";
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT o.os_id, o.os_descricao, o.os_resumo, COALESCE(t.departamento, t.nome_time) AS departamento
       FROM os o
       LEFT JOIN time t ON t.id_time = o.id_time_responsavel
      WHERE ${coluna} = ?
      ORDER BY o.data_criacao, o.os_id`,
    [id],
  );
  return rows;
}

async function buscarEquipamentos(tipo: "projeto" | "manutencao", id: string) {
  const coluna = tipo === "projeto" ? "o.projeto_id" : "o.manutencao_id";
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT e.nome_equipamento AS nome, SUM(i.quantidade) AS quantidade
       FROM os o
       JOIN item_equipamento_os i ON i.os_id = o.os_id
       JOIN equipamentos e ON e.equipamento_id = i.equipamento_id
      WHERE ${coluna} = ?
      GROUP BY e.equipamento_id, e.nome_equipamento
      ORDER BY e.nome_equipamento`,
    [id],
  );
  return rows.map((row) => ({
    nome: row.nome as string,
    quantidade: Number(row.quantidade),
  }));
}

export async function construirDadosRelatorio(
  tipo: "projeto" | "manutencao",
  id: string,
): Promise<ReportItem> {
  if (tipo === "projeto") {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, resp.nome AS responsavel_nome, vend.nome AS vendedor_nome
         FROM projetos p
         LEFT JOIN usuarios resp ON resp.id_usuario = p.responsavel_id
         LEFT JOIN usuarios vend ON vend.id_usuario = p.vendedor_id
        WHERE p.projeto_id = ? LIMIT 1`,
      [id],
    );
    const projeto = rows[0];
    if (!projeto) throw new Error("Entidade não encontrada.");
    const ordens = await buscarOrdensVinculadas("projeto", id);
    const equipamentos = await buscarEquipamentos("projeto", id);
    const departamentos = agruparDepartamentos(ordens);
    const assinatura = formatarData(projeto.data_assinatura_contrato);
    const vencimento = formatarData(projeto.data_vencimento_contrato);
    return {
      tipo: "projeto",
      tipoMinusculo: "projeto",
      titulo: projeto.nome as string,
      responsavel: ((projeto.responsavel_nome ?? projeto.vendedor_nome) as string | null) ?? "Não informado",
      dataInicio: formatarData(projeto.data_criacao) ?? hojePtBr(),
      dataConclusao: formatarData(projeto.data_limite) ?? hojePtBr(),
      dataEmissao: hojePtBr(),
      descricao: (projeto.descricao as string | null) ?? "",
      contrato: assinatura || vencimento ? { assinatura, vencimento } : null,
      categoria: projeto.tipo_sistema as string,
      equipamentos,
      departamentos,
    };
  }

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT m.*, resp.nome AS responsavel_nome, pr.nome AS projeto_nome,
            pr.data_assinatura_contrato, pr.data_vencimento_contrato
       FROM manutencoes m
       LEFT JOIN usuarios resp ON resp.id_usuario = m.responsavel_id
       LEFT JOIN projetos pr ON pr.projeto_id = m.projeto_id
      WHERE m.manutencao_id = ? LIMIT 1`,
    [id],
  );
  const manutencao = rows[0];
  if (!manutencao) throw new Error("Entidade não encontrada.");
  const ordens = await buscarOrdensVinculadas("manutencao", id);
  const equipamentos = await buscarEquipamentos("manutencao", id);
  const assinatura = formatarData(manutencao.data_assinatura_contrato);
  const vencimento = formatarData(manutencao.data_vencimento_contrato);
  return {
    tipo: "manutencao",
    tipoMinusculo: "manutencao",
    titulo: (manutencao.resumo as string | null) || (manutencao.projeto_nome as string | null) || "Manutenção",
    responsavel: (manutencao.responsavel_nome as string | null) ?? "Não informado",
    dataInicio: formatarData(manutencao.data_inicio_problema) ?? hojePtBr(),
    dataConclusao: formatarData(manutencao.data_limite) ?? hojePtBr(),
    dataEmissao: hojePtBr(),
    descricao: (manutencao.descricao_situacao as string | null) ?? "",
    contrato: assinatura || vencimento ? { assinatura, vencimento } : null,
    categoria: manutencao.tipo_manutencao as string,
    equipamentos,
    departamentos: agruparDepartamentos(ordens),
  };
}

export function agruparDepartamentos(ordens: RowDataPacket[]) {
  const mapa = new Map<string, { descricao: string; resumo: string }[]>();
  for (const ordem of ordens) {
    const nome = (ordem.departamento as string | null) ?? "Departamento não informado";
    if (!mapa.has(nome)) mapa.set(nome, []);
    mapa.get(nome)!.push({
      descricao: (ordem.os_descricao as string | null) || "Sem descrição informada.",
      resumo: (ordem.os_resumo as string | null) || "Sem resumo informado.",
    });
  }
  return Array.from(mapa, ([nome, ordensDepartamento]) => ({
    nome,
    ordens: ordensDepartamento,
  }));
}

export async function persistirRelatorio(
  tipo: "projeto" | "manutencao",
  id: string,
  pdf: Buffer,
  usuarioId?: string,
  connection?: PoolConnection,
): Promise<number> {
  const executor = connection ?? pool;
  const nome = `relatorio_${tipo}_${id}_${Date.now()}.pdf`;
  const [result] = await executor.execute<ResultSetHeader>(
    `INSERT INTO anexo
      (os_id, id_usuario_envio, nome_anexo, anexo_tipo, anexo_tamanho,
       manutencao_id, projeto_id, conteudo_arquivo)
     VALUES (NULL, ?, ?, 'application/pdf', ?, ?, ?, ?)`,
    [
      usuarioId ? Number(usuarioId) : null,
      nome,
      pdf.length,
      tipo === "manutencao" ? Number(id) : null,
      tipo === "projeto" ? Number(id) : null,
      pdf,
    ],
  );
  return result.insertId;
}

export async function gerarEArmazenarRelatorio(
  tipo: "projeto" | "manutencao",
  id: string,
  usuarioId?: string,
): Promise<{ id: number; nome: string; pdf: Buffer }> {
  const dados = await construirDadosRelatorio(tipo, id);
  const pdf = await gerarPdfRelatorio(dados);
  const relatorioId = await persistirRelatorio(tipo, id, pdf, usuarioId);
  return {
    id: relatorioId,
    nome: `relatorio_${tipo}_${id}_${Date.now()}.pdf`,
    pdf,
  };
}