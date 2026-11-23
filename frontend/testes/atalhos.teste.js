import test from "node:test";
import assert from "node:assert/strict";
import { deveAbrirSaude } from "../src/utilitarios/atalhos.js";
import { funcionalidades } from "../src/dados/sistema.js";

test("Shift + S abre o diagnóstico sem capturar digitação ou outros atalhos", () => {
  const evento = { shiftKey: true, key: "S", target: { closest: () => null } };
  assert.equal(deveAbrirSaude(evento), true);
  for (const alteracao of [{ shiftKey: false }, { ctrlKey: true }, { altKey: true }, { metaKey: true }, { repeat: true }, { isComposing: true }, { defaultPrevented: true }, { key: "a" }, { target: { closest: () => ({}) } }, { target: { isContentEditable: true } }]) {
    assert.equal(deveAbrirSaude({ ...evento, ...alteracao }), false);
  }
});

test("catálogo conserva identificação única e explicita operações sem interface", () => {
  assert.equal(new Set(funcionalidades.map((f) => f.numero)).size, funcionalidades.length);
  assert.ok(funcionalidades.filter((f) => f.rotas.some((r) => r.startsWith("DELETE /api/admin"))).every((f) => f.tela === null));
});
