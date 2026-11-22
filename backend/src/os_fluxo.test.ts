import assert from "node:assert/strict";
import test from "node:test";

import { validarTransicaoOS } from "./os_fluxo.js";

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
