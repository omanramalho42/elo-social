import assert from "node:assert/strict";
import test from "node:test";
import { criarGeocodificador, selecionarLocalizacao } from "../biblioteca/geocodificacao";

const rua = { type: "Feature", geometry: { type: "Point", coordinates: [-38.58, -3.75] }, properties: { city: "Fortaleza", name: "Rua Entrada da Lua", osm_key: "highway" } };
test("geocodificação respeita longitude/latitude e identifica precisão da via", () => {
  const resultado = selecionarLocalizacao({ features: [rua] }, "Rua Entrada da Lua, 170");
  assert.equal(resultado?.lat, -3.75); assert.equal(resultado?.lon, -38.58);
  assert.equal(resultado?.precisao, "via");
  const casa = { ...rua, properties: { ...rua.properties, street: "Rua Entrada da Lua", housenumber: "170" } };
  assert.equal(selecionarLocalizacao({ features: [casa] }, "Rua Entrada da Lua, 170")?.precisao, "numero");
});
test("geocodificação não inventa posição nem usa cidade, via diferente ou fora da região", () => {
  for (const resposta of [null, {}, { features: [] }, { features: [null] }, { features: [{ ...rua, geometry: { type: "Point", coordinates: [0, 0] } }] }, { features: [{ ...rua, properties: { city: "Fortaleza", name: "Fortaleza", osm_key: "place" } }] }, { features: [{ ...rua, properties: { ...rua.properties, city: "Caucaia" } }] }])
    assert.equal(selecionarLocalizacao(resposta, "Rua Entrada da Lua, 170"), null);
  assert.equal(selecionarLocalizacao({ features: [rua] }, "Rua de Teste, 100"), null);
});
test("buscas simultâneas do mesmo endereço usam uma consulta e reutilizam cache", async () => {
  let chamadas = 0;
  const buscar = criarGeocodificador((async () => { chamadas++; return Response.json({ features: [rua] }); }) as typeof fetch);
  const resultados = await Promise.all([buscar("Rua Entrada da Lua, 170", "Pici"), buscar("Rua Entrada da Lua, 170", "Pici")]);
  assert.equal(resultados[0]?.lat, -3.75);
  await buscar("Rua Entrada da Lua, 170", "Pici");
  assert.equal(chamadas, 1);
});
test("falha do provedor não expõe erro interno e permite nova tentativa", async () => {
  let chamadas = 0;
  const buscar = criarGeocodificador((async () => { if (++chamadas === 1) throw new Error("segredo-interno"); return Response.json({ features: [rua] }); }) as typeof fetch);
  await assert.rejects(buscar("Rua Entrada da Lua, 170", "Pici"), (erro: Error) => !erro.message.includes("segredo-interno"));
  assert.equal((await buscar("Rua Entrada da Lua, 170", "Pici"))?.lat, -3.75);
});
