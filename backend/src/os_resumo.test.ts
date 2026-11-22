import assert from "node:assert/strict";
import test from "node:test";

import {
  LIMITE_RESUMO_OS,
  MENSAGEM_RESUMO_AGUARDA_APROVACAO,
  MENSAGEM_RESUMO_JA_CONCLUIDA,
  MENSAGEM_RESUMO_LIMITE,
  MENSAGEM_RESUMO_OBRIGATORIO,
  motivoResumoBloqueado,
  podeGerenciarResumo,
  resumoLiberado,
  validarResumo,
} from "./os_resumo.js";

test("resumo vazio, só com espaços ou que não seja texto é recusado", () => {
  assert.deepEqual(validarResumo(""), { erro: MENSAGEM_RESUMO_OBRIGATORIO });
  assert.deepEqual(validarResumo("   \n\t "), { erro: MENSAGEM_RESUMO_OBRIGATORIO });
  assert.deepEqual(validarResumo(undefined), { erro: MENSAGEM_RESUMO_OBRIGATORIO });
  assert.deepEqual(validarResumo(null), { erro: MENSAGEM_RESUMO_OBRIGATORIO });
  assert.deepEqual(validarResumo(123), { erro: MENSAGEM_RESUMO_OBRIGATORIO });
});

test("resumo acima do limite é recusado e no limite é aceito", () => {
  assert.deepEqual(validarResumo("a".repeat(LIMITE_RESUMO_OS + 1)), { erro: MENSAGEM_RESUMO_LIMITE });
  assert.deepEqual(validarResumo("a".repeat(LIMITE_RESUMO_OS)), { resumo: "a".repeat(LIMITE_RESUMO_OS) });
});

test("espaços nas pontas não contam para o limite e são removidos", () => {
  assert.deepEqual(validarResumo(`  ${"a".repeat(LIMITE_RESUMO_OS)}  `), { resumo: "a".repeat(LIMITE_RESUMO_OS) });
  assert.deepEqual(validarResumo("  Instalação concluída  "), { resumo: "Instalação concluída" });
});

test("só o líder do time responsável gerencia o resumo (nem o superusuário)", () => {
  const os = { time_responsavel_id: 7 };
  assert.equal(podeGerenciarResumo({ id: "7" }, os), true);
  assert.equal(podeGerenciarResumo({ id: "8" }, os), false); // membro do time que não é líder
  assert.equal(podeGerenciarResumo({ id: "1" }, os), false); // ex.: superusuário, gestor, monitoramento
  assert.equal(podeGerenciarResumo({ id: "7" }, { time_responsavel_id: null }), false);
});

test("o resumo só é liberado em Review depois da aprovação do monitoramento", () => {
  assert.equal(resumoLiberado("review", true, false), true);
  // Review sem aprovação (ainda não passou pela verificação), ou outras etapas: não libera.
  assert.equal(resumoLiberado("review", false, false), false);
  for (const status of ["aberta", "em andamento", "teste", "bloqueado", "verificacao", "concluida"]) {
    assert.equal(resumoLiberado(status, true, false), false, status);
  }
  // O.S. do próprio time de monitoramento não passa por verificação: libera direto em Review.
  assert.equal(resumoLiberado("review", false, true), true);
  assert.equal(resumoLiberado("teste", false, true), false);
});

test("motivo do bloqueio do resumo", () => {
  assert.equal(motivoResumoBloqueado("review", true, false), null);
  assert.equal(motivoResumoBloqueado("concluida", true, false), MENSAGEM_RESUMO_JA_CONCLUIDA);
  assert.equal(motivoResumoBloqueado("review", false, false), MENSAGEM_RESUMO_AGUARDA_APROVACAO);
  assert.equal(motivoResumoBloqueado("verificacao", false, false), MENSAGEM_RESUMO_AGUARDA_APROVACAO);
  assert.equal(motivoResumoBloqueado("teste", false, false), MENSAGEM_RESUMO_AGUARDA_APROVACAO);
});