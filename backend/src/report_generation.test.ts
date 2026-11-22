import assert from "node:assert/strict";
import test from "node:test";

import { agruparDepartamentos, renderTemplate } from "./report_generation.js";

test("agrupar departamentos preserva ordens e departamentos sem contribuição", () => {
  const departamentos = agruparDepartamentos([
    { departamento: "Produção", os_descricao: "Instalar o módulo X", os_resumo: "Instalação concluída" } as never,
  ]);
  assert.deepEqual(departamentos, [
    { nome: "Produção", ordens: [{ descricao: "Instalar o módulo X", resumo: "Instalação concluída" }] },
  ]);

  assert.deepEqual(
    agruparDepartamentos([{ departamento: null, os_descricao: null, os_resumo: null } as never]),
    [{
      nome: "Departamento não informado",
      ordens: [{ descricao: "Sem descrição informada.", resumo: "Sem resumo informado." }],
    }],
  );
});

test("template apresenta fallbacks sem equipamentos e sem contrato", () => {
  const item = {
    tipo: "projeto" as const,
    tipoMinusculo: "projeto" as const,
    titulo: "Projeto teste",
    responsavel: "Ana",
    dataInicio: "01/11/2026",
    dataConclusao: "20/11/2026",
    dataEmissao: "20/11/2026",
    descricao: "Descrição",
    contrato: null,
    categoria: "ERP",
    equipamentos: [],
    departamentos: [],
  };
  const html = renderTemplate(
    "{{titulo}} {{#if contrato}}{{contrato.assinatura}}{{else}}Sem contrato{{/if}} {{#each equipamentos}}{{nome}}{{/each}}",
    item,
  );
  assert.match(html, /Projeto teste/);
  assert.match(html, /Sem contrato/);
  assert.doesNotMatch(html, /{{/);
});

test("relatório mostra a descrição e o resumo de cada O.S. no departamento", async () => {
  const { readFile } = await import("node:fs/promises");
  const template = await readFile(new URL("./templates/report-template.html", import.meta.url), "utf8");
  const html = renderTemplate(template, {
    tipo: "manutencao" as const,
    tipoMinusculo: "manutencao" as const,
    titulo: "Manutenção teste",
    responsavel: "Ana",
    dataInicio: "01/11/2026",
    dataConclusao: "20/11/2026",
    dataEmissao: "20/11/2026",
    descricao: "Descrição da manutenção",
    contrato: null,
    categoria: "corretiva",
    equipamentos: [],
    departamentos: [
      {
        nome: "software",
        ordens: [
          { descricao: "Corrigir o login <b>", resumo: "Corrigimos. Custo: $& e $1" },
          { descricao: "Segunda O.S.", resumo: "Sem resumo informado." },
        ],
      },
      { nome: "producao", ordens: [{ descricao: "Montar o painel", resumo: "Painel montado." }] },
    ],
  });
  assert.match(html, /<strong>Descrição:<\/strong> Corrigir o login &lt;b&gt;/);
  assert.match(html, /<strong>Resumo:<\/strong> Corrigimos\. Custo: \$&amp; e \$1/);
  assert.match(html, /<strong>Descrição:<\/strong> Segunda O\.S\./);
  // Segundo departamento e listas fechadas corretamente (bug antigo: marcadores vazios).
  assert.match(html, /<h3>producao<\/h3>\s*<ul><li><strong>Descrição:<\/strong> Montar o painel<br><strong>Resumo:<\/strong> Painel montado\.<\/li><\/ul>/);
  assert.equal((html.match(/<ul>/g) ?? []).length, (html.match(/<\/ul>/g) ?? []).length);
  assert.doesNotMatch(html, /<li><\/li>/);
  assert.doesNotMatch(html, /{{/);
});