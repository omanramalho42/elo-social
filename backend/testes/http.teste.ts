import assert from "node:assert/strict";
import { test } from "node:test";
import { ErroApi, lerJson, ok, rota } from "../biblioteca/http";

const pedido = (body: string, tipo = "application/json") =>
  new Request("http://localhost/api", { method: "POST", headers: { "content-type": tipo }, body });
const comStatus = (status: number) => (erro: unknown) => erro instanceof ErroApi && erro.status === status;

test("JSON: aceita charset e rejeita tipo falso, JSON inválido e corpo vazio", async () => {
  assert.deepEqual(await lerJson(pedido('{"nome":"Ação"}', "application/json; charset=utf-8")), { nome: "Ação" });
  await assert.rejects(lerJson(pedido("{}", "text/application/json")), comStatus(415));
  await assert.rejects(lerJson(pedido("{invalido}")), comStatus(400));
  await assert.rejects(lerJson(pedido("")), comStatus(400));
});

test("JSON: limita bytes UTF-8 e não apenas quantidade de caracteres", async () => {
  const texto = JSON.stringify({ texto: "á".repeat(11000) });
  assert.ok(texto.length < 20000);
  await assert.rejects(lerJson(pedido(texto)), comStatus(413));
});

test("rota: oculta detalhes internos e preserva erros de API", async () => {
  const original = console.error;
  console.error = () => {};
  try {
    const interna = rota(async () => { throw new Error("detalhe interno privado"); });
    const resposta = await interna(new Request("http://localhost/api"), undefined);
    assert.equal(resposta.status, 500);
    assert.deepEqual(await resposta.json(), { erro: "Erro interno." });
    const protegida = rota(async () => { throw new ErroApi(401, "Entre na sua conta."); });
    assert.equal((await protegida(new Request("http://localhost/api"), undefined)).status, 401);
    assert.equal((await rota(async () => ok({ ok: true }))(new Request("http://localhost/api"), undefined)).status, 200);
  } finally { console.error = original; }
});
