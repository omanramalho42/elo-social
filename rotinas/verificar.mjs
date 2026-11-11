import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("../", import.meta.url));
const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error("Execute pela raiz com: npm run verificar");
  process.exit(1);
}

// Sequencial: o Next gera arquivos de tipos durante a compilação.
const etapas = [
  ["backend", "test"],
  ["frontend", "test"],
  ["backend", "build"],
  ["backend", "typecheck"],
  ["frontend", "build"],
];
for (const [diretorio, tarefa] of etapas) {
  console.log(`\nVerificando ${diretorio}: ${tarefa}`);
  const resultado = spawnSync(
    process.execPath,
    [npmCli, "--prefix", diretorio, "run", tarefa],
    { cwd: raiz, stdio: "inherit" },
  );
  if (resultado.error) console.error(resultado.error.message);
  if (resultado.status !== 0) process.exit(resultado.status || 1);
}
console.log("\nVerificações locais concluídas. Fluxos com Supabase exigem ensaio separado.");
