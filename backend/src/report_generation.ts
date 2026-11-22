import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import PDFDocument from "pdfkit";

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
  ordensServico: {
    id: number;
    data: string | null;
    departamento: string;
    descricao: string;
    resumo: string;
  }[];
};

function formatarData(valor: unknown): string | null {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(valor);
  }
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

// ---------------------------------------------------------------------------
// Geração do PDF (PDFKit: Node puro, sem navegador e sem download extra)
// ---------------------------------------------------------------------------

const COR_PRIMARIA = "#224b95";
const COR_TEXTO = "#1f2937";
const COR_SECUNDARIA = "#6b7280";
const COR_LINHA = "#d1d5db";

export function gerarPdfRelatorio(item: ReportItem): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const nomeTipo = item.tipo === "projeto" ? "Projeto" : "Manutenção";

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true, // necessário para escrever o rodapé com número de página no final
      info: {
        Title: `Relatório de ${nomeTipo} - ${item.titulo}`,
        Author: item.responsavel,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      const L = doc.page.margins.left;
      const W = doc.page.width - L - doc.page.margins.right;
      const limiteInferior = () => doc.page.height - doc.page.margins.bottom;

      const garantirEspaco = (altura: number) => {
        if (doc.y + altura > limiteInferior()) doc.addPage();
      };

      const bloco = (
        texto: string,
        opcoes: { recuo?: number; fonte?: string; tamanho?: number; cor?: string; espacoDepois?: number } = {},
      ) => {
        const recuo = opcoes.recuo ?? 0;
        doc
          .font(opcoes.fonte ?? "Helvetica")
          .fontSize(opcoes.tamanho ?? 11)
          .fillColor(opcoes.cor ?? COR_TEXTO)
          .text(texto, L + recuo, undefined, { width: W - recuo });
        doc.x = L;
        if (opcoes.espacoDepois) doc.y += opcoes.espacoDepois;
      };

      const campo = (rotulo: string, valor: string) => {
        garantirEspaco(20);
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor(COR_TEXTO)
          .text(`${rotulo}: `, L, undefined, { continued: true, width: W });
        doc.font("Helvetica").text(valor, { width: W });
        doc.x = L;
        doc.y += 2;
      };

      const secao = (titulo: string) => {
        garantirEspaco(60); // evita título sozinho no fim da página
        doc.y += 12;
        bloco(titulo, { fonte: "Helvetica-Bold", tamanho: 13, cor: COR_PRIMARIA, espacoDepois: 2 });
        doc
          .moveTo(L, doc.y)
          .lineTo(L + W, doc.y)
          .lineWidth(0.8)
          .strokeColor(COR_LINHA)
          .stroke();
        doc.y += 8;
      };

      // Cabeçalho
      doc.rect(0, 0, doc.page.width, 90).fill(COR_PRIMARIA);
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor("#ffffff")
        .text(`Relatório de ${nomeTipo}`, L, 28, { width: W });
      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#dbe4f5")
        .text(item.titulo, L, 56, { width: W, height: 28, ellipsis: true });
      doc.x = L;
      doc.y = 115;

      // Dados gerais
      campo("Responsável", item.responsavel);
      campo("Período", `${item.dataInicio} a ${item.dataConclusao}`);
      campo("Categoria", item.categoria);
      if (item.contrato) {
        campo("Assinatura do contrato", item.contrato.assinatura ?? "Não informada");
        campo("Vencimento do contrato", item.contrato.vencimento ?? "Não informado");
      }

      // Descrição
      secao("Descrição");
      bloco(item.descricao || "Sem descrição informada.");

      // Equipamentos
      secao("Equipamentos");
      if (item.equipamentos.length) {
        for (const equipamento of item.equipamentos) {
          garantirEspaco(18);
          bloco(`•  ${equipamento.nome}: ${equipamento.quantidade}`, { recuo: 8, espacoDepois: 2 });
        }
      } else {
        bloco("Nenhum equipamento utilizado.", { cor: COR_SECUNDARIA });
      }

      // Departamentos e ordens de serviço
      secao("Departamentos");
      if (!item.departamentos.length) {
        bloco("Este departamento não teve contribuição.", { cor: COR_SECUNDARIA });
      }
      for (const departamento of item.departamentos) {
        garantirEspaco(50);
        bloco(departamento.nome, { fonte: "Helvetica-Bold", tamanho: 12, espacoDepois: 3 });
        if (!departamento.ordens.length) {
          bloco("Este departamento não teve contribuição.", { recuo: 10, cor: COR_SECUNDARIA, espacoDepois: 6 });
          continue;
        }
        for (const ordem of departamento.ordens) {
          garantirEspaco(24);
          bloco(`•  ${ordem.descricao}`, { recuo: 10, espacoDepois: 3 });
        }
        doc.y += 4;
      }

      // Resumos das ordens de serviço (ordem cronológica)
      secao("Resumo das Ordens de Serviço");
      if (!item.ordensServico.length) {
        bloco("Nenhuma ordem de serviço vinculada.", { cor: COR_SECUNDARIA });
      }
      for (const os of item.ordensServico) {
        garantirEspaco(70);
        const data = os.data ? `  |  ${os.data}` : "";
        bloco(`OS #${os.id}${data}`, { fonte: "Helvetica-Bold", cor: COR_PRIMARIA, espacoDepois: 1 });
        bloco(os.departamento, { tamanho: 9, cor: COR_SECUNDARIA, espacoDepois: 2 });
        bloco(os.descricao, { fonte: "Helvetica-Bold", espacoDepois: 2 });
        bloco(os.resumo, { recuo: 10, espacoDepois: 10 });
      }

      // Rodapé em todas as páginas
      const paginas = doc.bufferedPageRange();
      for (let i = 0; i < paginas.count; i++) {
        doc.switchToPage(paginas.start + i);
        doc.page.margins.bottom = 0; // evita que o texto do rodapé crie uma página nova
        const y = doc.page.height - 35;
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor(COR_SECUNDARIA)
          .text(`Emitido em ${item.dataEmissao}`, L, y, { width: W, align: "left", lineBreak: false });
        doc.text(`Página ${i + 1} de ${paginas.count}`, L, y, { width: W, align: "right", lineBreak: false });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// ---------------------------------------------------------------------------
// Consultas ao banco
// ---------------------------------------------------------------------------

async function buscarOrdensVinculadas(
  tipo: "projeto" | "manutencao",
  id: string,
): Promise<RowDataPacket[]> {
  const coluna = tipo === "projeto" ? "o.projeto_id" : "o.manutencao_id";
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT o.os_id, o.os_descricao, o.os_resumo, o.data_criacao, COALESCE(t.departamento, t.nome_time) AS departamento
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
      ordensServico: listarOrdens(ordens),
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
    ordensServico: listarOrdens(ordens),
  };
}

export function listarOrdens(ordens: RowDataPacket[]): ReportItem["ordensServico"] {
  // A consulta já vem ordenada por data_criacao e os_id (ordem cronológica).
  return ordens.map((ordem) => ({
    id: Number(ordem.os_id),
    data: formatarData(ordem.data_criacao),
    departamento: (ordem.departamento as string | null) ?? "Departamento não informado",
    descricao: (ordem.os_descricao as string | null) || "Sem descrição informada.",
    resumo: (ordem.os_resumo as string | null) || "Sem resumo informado.",
  }));
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