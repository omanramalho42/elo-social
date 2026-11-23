import test from "node:test";
import assert from "node:assert/strict";
import { validarLocalizacao } from "../src/utilitarios/localizacao.js";

test("aprovação não confunde coordenadas ausentes, zero ou inválidas com uma posição", () => {
  for (const [lat, lon] of [["", ""], [" ", "-38.52"], [0, 0], ["abc", "-38.52"], [Infinity, -38.52], [-3.73, -39]]) {
    assert.equal(validarLocalizacao(lat, lon).valida, false);
  }
});

test("aprovação aceita coordenadas conferidas com ponto ou vírgula e preserva a precisão", () => {
  for (const [lat, lon] of [["-3,731234", "-38,521234"], [-3.731234, -38.521234]]) {
    assert.deepEqual(validarLocalizacao(lat, lon), { valida: true, lat: -3.731234, lon: -38.521234, mensagem: "Localização preenchida. Confira se o ponto corresponde ao endereço da ONG antes de aprovar." });
  }
  assert.equal(validarLocalizacao(-4.1, -38.8).valida, true);
  assert.equal(validarLocalizacao(-3.6, -38.3).valida, true);
});
