import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

let pendencias = 0;
function conferir(ok, descricao) {
  console.log(`${ok ? "OK" : "PENDENTE"}: ${descricao}`);
  if (!ok) pendencias++;
}
console.log(`Node.js ${process.version}`);
for (const pasta of ["backend", "frontend"]) {
  conferir(existsSync(new URL(`../${pasta}/node_modules/`, import.meta.url)), `dependências de ${pasta}`);
}

const arquivo = new URL("../backend/.env.local", import.meta.url);
const ambiente = existsSync(arquivo)
  ? readFileSync(arquivo, "utf8").replace(/^\uFEFF/, "")
  : "";
const valores = {};
for (const linha of ambiente.split(/\r?\n/)) {
  const partes = linha.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
  if (partes) valores[partes[1]] = partes[2].replace(/^(['"])(.*)\1$/, "$2");
}
conferir(existsSync(arquivo), "backend/.env.local (copie de backend/.env.example e configure)");
for (const chave of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SITE_URL", "FRONTEND_URL"]) {
  const valor = valores[chave];
  let valido = Boolean(valor) && !/SEU-PROJETO|chave-anon|chave-service-role|sua-chave/i.test(valor);
  if (valido && chave.endsWith("URL")) {
    try {
      valido = ["http:", "https:"].includes(new URL(valor).protocol);
    } catch { valido = false; }
  }
  // Apenas nomes e presença. Nunca mostrar valores de credenciais.
  conferir(valido, `${chave} configurada`);
}
console.log(`\n${pendencias} pendência(s). Este diagnóstico não conecta ao banco nem valida credenciais.`);
console.log(`Referência: ${fileURLToPath(new URL("../docs/RETOMADA.md", import.meta.url))}`);
process.exitCode = pendencias ? 1 : 0;
