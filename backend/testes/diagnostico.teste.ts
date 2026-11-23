import assert from "node:assert/strict";
import test from "node:test";
import { inventarioRotas, publicacaoPublica, sondar } from "../biblioteca/diagnostico";

test("diagnóstico publica somente metadados permitidos, sem credenciais ou URLs inválidas", () => {
  const segredo = "SEGREDO_NAO_PUBLICAR_123";
  const resultado = publicacaoPublica({ NODE_ENV: "production", RENDER: "true", RENDER_GIT_COMMIT: "abcd1234", RENDER_GIT_BRANCH: "main", SUPABASE_SERVICE_ROLE_KEY: segredo, NEXT_PUBLIC_SUPABASE_ANON_KEY: segredo });
  assert.equal(resultado.plataforma, "Render");
  assert.equal(resultado.commit, "abcd1234");
  assert.equal(JSON.stringify(resultado).includes(segredo), false);
  const invalido = publicacaoPublica({ SITE_URL: `https://user:${segredo}@example.com`, RENDER_GIT_COMMIT: segredo, RENDER_GIT_BRANCH: `<${segredo}>` });
  assert.equal(invalido.backend, null);
  assert.equal(invalido.commit, null);
  assert.equal(invalido.ramo, null);
  assert.equal(JSON.stringify(invalido).includes(segredo), false);
});

test("sondagem distingue falha e sucesso sem publicar erros internos", async () => {
  assert.equal((await sondar(async () => {})).situacao, "ok");
  const falha = await sondar(async () => { throw new Error("token-secreto-no-erro"); });
  assert.equal(falha.situacao, "indisponivel");
  assert.ok(falha.duracaoMs >= 0);
  assert.equal(JSON.stringify(falha).includes("token-secreto"), false);
});

test("inventário conserva métodos distintos e permissões das rotas", () => {
  const rotas = inventarioRotas();
  assert.equal(new Set(rotas.map((r) => `${r.metodo} ${r.caminho}`)).size, rotas.length);
  assert.ok(rotas.some((r) => r.caminho === "/api/saude/detalhes"));
  assert.ok(rotas.some((r) => r.caminho === "/api/openapi"));
  assert.ok(rotas.some((r) => r.metodo === "DELETE" && r.caminho === "/api/admin/ongs/{id}" && r.acesso === "Administrador"));
  assert.equal(rotas.find((r) => r.caminho === "/api/cadastro")?.acesso, "Conta autenticada");
});
