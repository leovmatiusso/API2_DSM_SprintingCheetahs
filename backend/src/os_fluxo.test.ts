import assert from "node:assert/strict";
import test from "node:test";

import { isTimeMonitoramento, isTimeSoftware, validarTransicaoOS } from "./os_fluxo.js";

test("identifica times de monitoramento pelo departamento", () => {
  assert.equal(isTimeMonitoramento("monitoramento"), true);
  assert.equal(isTimeMonitoramento("Monitoramento"), true);
  assert.equal(isTimeMonitoramento("software"), false);
  assert.equal(isTimeMonitoramento(null), false);
});

test("qualquer usuário pode encaminhar uma OS ativa para Review", () => {
  assert.equal(validarTransicaoOS("aberta", "review", false), null);
  assert.equal(validarTransicaoOS("em andamento", "review", false), null);
  assert.equal(validarTransicaoOS("teste", "review", false), null);
});

test("somente o responsável decide uma OS em Review", () => {
  assert.equal(validarTransicaoOS("review", "teste", true), null);
  assert.equal(validarTransicaoOS("review", "bloqueado", true), null);
  assert.equal(validarTransicaoOS("review", "concluida", true), null);
  assert.equal(validarTransicaoOS("review", "teste", false)?.status, 403);
  assert.equal(validarTransicaoOS("review", "concluida", false)?.status, 403);
});

test("somente o responsável libera uma OS bloqueada para Teste", () => {
  assert.equal(validarTransicaoOS("bloqueado", "teste", true), null);
  assert.equal(validarTransicaoOS("bloqueado", "teste", false)?.status, 403);
  assert.equal(validarTransicaoOS("bloqueado", "review", true)?.status, 409);
});

test("bloquear ou concluir exige Review e OS concluída não reabre", () => {
  assert.equal(validarTransicaoOS("teste", "bloqueado", true)?.status, 409);
  assert.equal(validarTransicaoOS("em andamento", "concluida", true)?.status, 409);
  assert.equal(validarTransicaoOS("concluida", "teste", true)?.status, 409);
});

test("OS de software não pode ser concluída direto da Review", () => {
  assert.equal(validarTransicaoOS("review", "concluida", true, true)?.status, 409);
  assert.equal(validarTransicaoOS("review", "concluida", true, false), null);
});

test("somente o responsável de um time de software envia a OS em Review para verificação", () => {
  assert.equal(validarTransicaoOS("review", "verificacao", true, true), null);
  assert.equal(validarTransicaoOS("review", "verificacao", false, true)?.status, 403);
  assert.equal(validarTransicaoOS("review", "verificacao", true, false)?.status, 409);
  assert.equal(validarTransicaoOS("teste", "verificacao", true, true)?.status, 409);
  assert.equal(validarTransicaoOS("bloqueado", "verificacao", true, true)?.status, 409);
});

test("OS em verificação não muda de status pela rota comum", () => {
  assert.equal(validarTransicaoOS("verificacao", "concluida", true, true)?.status, 409);
  assert.equal(validarTransicaoOS("verificacao", "bloqueado", true, true)?.status, 409);
  assert.equal(validarTransicaoOS("verificacao", "teste", true, true)?.status, 409);
});

test("identifica times de software pelo departamento", () => {
  assert.equal(isTimeSoftware("software"), true);
  assert.equal(isTimeSoftware("Software"), true);
  assert.equal(isTimeSoftware("producao"), false);
  assert.equal(isTimeSoftware(null), false);
});
