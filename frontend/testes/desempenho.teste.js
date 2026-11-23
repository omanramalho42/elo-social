import test from "node:test";
import assert from "node:assert/strict";
import { projetarDemanda, validarRelatorioCarga } from "../src/utilitarios/desempenho.js";
import { readFileSync } from "node:fs";

test("projeção de 50 milhões explicita chamadas e intervalo por usuário", () => {
  assert.equal(projetarDemanda(50_000_000, 1, 30), 50_000_000 / 30);
  assert.equal(projetarDemanda(100_000_000, 5, 10), 50_000_000);
});
test("projeção recusa valores inválidos e não interpreta campo vazio como zero", () => {
  for (const valores of [[0, 1, 30], [NaN, 1, 30], [1, 0, 30], [1, 1, 0], [Infinity, 1, 30], [1_000_000_001, 1, 30], [1, 101, 30]]) assert.equal(projetarDemanda(...valores), null);
});

test("relatório só é aceito com ambiente, percentis e contadores consistentes", () => {
  const relatorio = JSON.parse(readFileSync(new URL("../publico/diagnosticos/carga.json", import.meta.url), "utf8"));
  assert.equal(validarRelatorioCarga(relatorio), true);
  for (const invalidar of [
    (r) => { delete r.ambiente; },
    (r) => { r.metodologia.producaoMedida = true; },
    (r) => { r.etapas[0].resumo.erros = -1; },
    (r) => { r.etapas[0].rotas[0].p95Ms = -1; },
    (r) => { r.etapas[0].rotas = []; },
    (r) => { r.etapas[0] = null; },
    (r) => { r.commitBase = 123; },
  ]) {
    const copia = structuredClone(relatorio); invalidar(copia);
    assert.equal(validarRelatorioCarga(copia), false);
  }
});
