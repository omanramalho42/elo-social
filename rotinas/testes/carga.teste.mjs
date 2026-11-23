import test from "node:test";
import assert from "node:assert/strict";
import { resumirAmostras } from "../apoio/metricas-carga.mjs";

test("percentis usam a distribuição de todas as chamadas, com falhas separadas", () => {
  const amostras = Array.from({ length: 100 }, (_, i) => ({ ms: i + 1, sucesso: i < 95 }));
  const resultado = resumirAmostras(amostras, 2000);
  assert.equal(resultado.total, 100); assert.equal(resultado.sucessos, 95); assert.equal(resultado.erros, 5);
  assert.equal(resultado.p50Ms, 50); assert.equal(resultado.p95Ms, 95); assert.equal(resultado.p99Ms, 99);
  assert.equal(resultado.requisicoesPorSegundo, 50); assert.equal(resultado.sucessosPorSegundo, 47.5);
  assert.equal(resultado.taxaErro, .05);
});
test("ausência de amostras não é apresentada como sucesso ou latência zero", () => {
  const resultado = resumirAmostras([], 1000);
  assert.equal(resultado.total, 0); assert.equal(resultado.p95Ms, null); assert.equal(resultado.taxaErro, null);
});
test("métricas rejeitam tempo ou amostras inválidas", () => {
  for (const tempo of [0, -1, Infinity, NaN]) assert.throws(() => resumirAmostras([], tempo));
  assert.throws(() => resumirAmostras([{ ms: NaN, sucesso: true }], 1000));
});
