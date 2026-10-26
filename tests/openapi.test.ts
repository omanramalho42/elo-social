import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { openapi } from "../src/lib/openapi";

function rotas(dir: string, base = ""): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return rotas(caminho, `${base}/${nome}`);
    return nome === "route.ts" ? [base] : [];
  });
}

test("toda rota /api (exceto /api/openapi) e todo método estão documentados no Swagger", () => {
  const raiz = join(__dirname, "../src/app/api");
  for (const rota of rotas(raiz).filter((r) => r !== "/openapi")) {
    const codigo = readFileSync(join(raiz, rota, "route.ts"), "utf8");
    const caminho = "/api" + rota.replace(/\[(\w+)\]/g, "{$1}");
    const doc = (openapi.paths as Record<string, Record<string, unknown>>)[caminho];
    assert.ok(doc, `rota sem documentação: ${caminho}`);
    for (const m of ["GET", "POST", "PATCH", "DELETE"]) {
      if (new RegExp(`export const ${m} =`).test(codigo)) {
        assert.ok(doc[m.toLowerCase()], `${m} ${caminho} não está no Swagger`);
      }
    }
  }
});

test("CRUD: ONGs e projetos têm Create, Read, Update e Delete documentados", () => {
  const p = openapi.paths as Record<string, Record<string, unknown>>;
  assert.ok(p["/api/cadastro"].post && p["/api/ongs"].get && p["/api/painel"].patch && p["/api/painel"].delete);
  assert.ok(p["/api/painel/projetos"].post && p["/api/painel"].get && p["/api/painel/projetos/{id}"].patch && p["/api/painel/projetos/{id}"].delete);
});

test("a especificação é um OpenAPI 3 válido", async () => {
  const SwaggerParser = (await import("@apidevtools/swagger-parser")).default;
  await SwaggerParser.validate(JSON.parse(JSON.stringify(openapi)));
});
