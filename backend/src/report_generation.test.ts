import assert from "node:assert/strict";
import test from "node:test";

import { agruparDepartamentos, renderTemplate } from "./report_generation.js";

test("agrupar departamentos preserva ordens e departamentos sem contribuição", () => {
  const departamentos = agruparDepartamentos([
    { departamento: "Produção", os_descricao: "Instalação concluída" } as never,
  ]);
  assert.deepEqual(departamentos, [
    { nome: "Produção", ordens: [{ resumo: "Instalação concluída" }] },
  ]);

  assert.deepEqual(
    agruparDepartamentos([{ departamento: null, os_descricao: null } as never]),
    [{ nome: "Departamento não informado", ordens: [{ resumo: "Sem resumo informado." }] }],
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
