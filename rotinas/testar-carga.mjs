// Executa somente contra os processos locais iniciados por esta rotina.
// Nunca usa as credenciais ou o banco de backend/.env.local.
import { createServer } from "node:http";
import { createServer as criarReserva } from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { cpus, freemem, totalmem } from "node:os";
import { setTimeout as aguardar } from "node:timers/promises";
import { resumirAmostras } from "./apoio/metricas-carga.mjs";

const raiz = fileURLToPath(new URL("../", import.meta.url));
const backend = fileURLToPath(new URL("../backend/", import.meta.url));
const niveis = [1, 10, 50, 100, 250, 500, 1000];
const duracaoEtapaMs = 6000;
const atrasoBancoMs = 25;
const limiteChamadas = 200000;
const rotas = ["/api/ongs?limite=100", "/api/ongs/1", "/api/saude"];
const controlador = new AbortController();
let servidorApi;
let chamadas = 0;
let cursor = 0;
let consultasSimuladas = 0;
const inicioEnsaio = performance.now();
const limiteTempo = setTimeout(() => controlador.abort(), 180000);
const interromper = () => controlador.abort();
process.once("SIGINT", interromper);
process.once("SIGTERM", interromper);

const instituicoes = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1, nome: `Instituição sintética ${i + 1}`, bairro: "Bairro de ensaio", area: "Educação",
  descricao: "Dados sintéticos usados exclusivamente no teste isolado de concorrência da API. Não representam instituições reais.",
  endereco: "Endereço sintético de ensaio", contato: "ensaio@example.invalid", cnpj: "00000000000000",
  site: null, lat: -3.75, lon: -38.55, verificacao: "demonstrativo", projetos: [{ count: 3 }],
}));
const simulador = createServer(async (req, res) => {
  consultasSimuladas++;
  await aguardar(atrasoBancoMs);
  if (res.destroyed) return;
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname === "/auth/v1/health") {
    res.writeHead(200, { "Content-Type": "application/json" }); res.end('{"status":"ok"}'); return;
  }
  if (url.pathname !== "/rest/v1/ongs") { res.writeHead(404); res.end(); return; }
  const unica = url.searchParams.has("id");
  res.writeHead(200, { "Content-Type": "application/json", "Content-Range": unica ? "0-0/1" : "0-99/100", "Access-Control-Expose-Headers": "Content-Range" });
  if (req.method === "HEAD") { res.end(); return; }
  const ong = { ...instituicoes[0], projetos: [{ id: 1, nome: "Projeto sintético", descricao: "Projeto de ensaio isolado." }] };
  const dados = unica ? req.headers.accept?.includes("vnd.pgrst.object") ? ong : [ong] : instituicoes;
  res.end(JSON.stringify(dados));
});

async function portaLivre() {
  const reserva = criarReserva();
  await new Promise((resolver, rejeitar) => { reserva.once("error", rejeitar); reserva.listen(0, "127.0.0.1", resolver); });
  const porta = reserva.address().port;
  await new Promise((resolver) => reserva.close(resolver));
  return porta;
}

async function medirEtapa(origem, concorrencia) {
  const inicio = performance.now();
  const fimLancamento = inicio + duracaoEtapaMs;
  const porRota = Object.fromEntries(rotas.map((rota) => [rota, []]));
  const causas = { http: 0, conexaoOuTimeout: 0 };
  async function cliente() {
    while (!controlador.signal.aborted && performance.now() < fimLancamento && chamadas < limiteChamadas) {
      chamadas++;
      const rota = rotas[cursor++ % rotas.length];
      const inicioChamada = performance.now();
      let sucesso = false;
      try {
        const resposta = await fetch(origem + rota, { signal: AbortSignal.any([controlador.signal, AbortSignal.timeout(3000)]), redirect: "error" });
        await resposta.arrayBuffer();
        sucesso = resposta.status === 200;
        if (!sucesso) causas.http++;
      } catch { causas.conexaoOuTimeout++; }
      porRota[rota].push({ ms: performance.now() - inicioChamada, sucesso });
    }
  }
  await Promise.all(Array.from({ length: concorrencia }, cliente));
  const duracaoMs = performance.now() - inicio;
  return {
    concorrencia, duracaoMs: Math.round(duracaoMs),
    resumo: resumirAmostras(Object.values(porRota).flat(), duracaoMs),
    rotas: rotas.map((rota) => ({ rota, ...resumirAmostras(porRota[rota], duracaoMs) })), causas,
  };
}

try {
  if (process.argv.length > 2) throw new Error("Este ensaio não aceita alvos ou parâmetros externos.");
  await readFile(new URL("../backend/.next/BUILD_ID", import.meta.url));
  await new Promise((resolver, rejeitar) => { simulador.once("error", rejeitar); simulador.listen(0, "127.0.0.1", resolver); });
  const origemBanco = `http://127.0.0.1:${simulador.address().port}`;
  const porta = await portaLivre();
  const origem = `http://127.0.0.1:${porta}`;
  servidorApi = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(porta)], {
    cwd: backend, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_SUPABASE_URL: origemBanco,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "carga-local-anon-sem-credencial", SUPABASE_SERVICE_ROLE_KEY: "carga-local-role-sem-credencial", SITE_URL: origem, FRONTEND_URL: origem },
  });
  let erroProcesso = false;
  servidorApi.once("error", () => { erroProcesso = true; });
  // Drenar os pipes sem registrar logs internos ou variáveis de ambiente.
  servidorApi.stdout.resume(); servidorApi.stderr.resume();
  let pronto = false;
  for (let i = 0; i < 60 && !controlador.signal.aborted; i++) {
    if (erroProcesso || servidorApi.exitCode !== null) break;
    try { const r = await fetch(origem + "/api/saude", { signal: AbortSignal.timeout(1000) }); await r.arrayBuffer(); if (r.status === 200) { pronto = true; break; } }
    catch { /* Inicialização do processo local. */ }
    await aguardar(200);
  }
  if (!pronto) throw new Error("A API isolada não iniciou. Execute npm run verificar e confira as portas locais.");
  for (let i = 0; i < 18; i++) {
    const rota = rotas[i % rotas.length];
    const r = await fetch(origem + rota, { signal: AbortSignal.timeout(3000) });
    const dados = await r.json();
    if (r.status !== 200 || rota.includes("?limite") && dados.ongs?.length !== 100 || rota.endsWith("/1") && dados.id !== 1) throw new Error("Aquecimento não validou os dados sintéticos.");
  }
  const etapas = [];
  let encerramento = "Todos os níveis programados foram executados; o limite real não foi determinado.";
  for (const concorrencia of niveis) {
    if (controlador.signal.aborted) throw new Error("Ensaio interrompido, sem publicar resultados parciais.");
    if (freemem() < 512 * 1024 * 1024) { encerramento = "Interrompido por limite de memória livre da máquina geradora."; break; }
    const etapa = await medirEtapa(origem, concorrencia);
    etapas.push(etapa);
    console.log(JSON.stringify({ clientesHttp: concorrencia, chamadas: etapa.resumo.total, reqPorSegundo: etapa.resumo.requisicoesPorSegundo, p95Ms: etapa.resumo.p95Ms, erros: etapa.resumo.erros }));
    if (etapa.resumo.taxaErro > .05 || etapa.resumo.p95Ms > 2000) { encerramento = "Ensaio encerrado após observar mais de 5% de erros ou P95 acima de 2 segundos; não atribui a causa apenas ao servidor."; break; }
    if (chamadas >= limiteChamadas) { encerramento = "Limite de 200 mil chamadas do ensaio atingido."; break; }
    await aguardar(400);
  }
  if (controlador.signal.aborted || !etapas.length) throw new Error("Ensaio não foi concluído.");
  const commit = spawnSync("git", ["rev-parse", "HEAD"], { cwd: raiz, encoding: "utf8", windowsHide: true }).stdout?.trim();
  const pacote = JSON.parse(await readFile(new URL("../backend/package.json", import.meta.url), "utf8"));
  const relatorio = {
    schema: 1, tipo: "local-isolado", geradoEm: new Date().toISOString(), commitBase: /^[a-f0-9]{40}$/.test(commit || "") ? commit : null,
    ambiente: { node: process.version, next: pacote.dependencies.next, processadoresLogicos: cpus().length, memoriaTotalGiB: Math.round(totalmem() / 1024 ** 3), geradorNoMesmoComputador: true, banco: "Simulador local de PostgREST/Supabase", atrasoBancoMs, registrosSinteticos: 100 },
    metodologia: { modelo: "Clientes HTTP em laço fechado, uma chamada em voo por cliente, rotas alternadas sem pausa entre ações.", janelaPorEtapaMs: duracaoEtapaMs, timeoutMs: 3000, limiteChamadas, limiteClientes: 1000, somenteLeitura: true, producaoMedida: false, duracaoTotalMs: Math.round(performance.now() - inicioEnsaio), consultasAoSimulador: consultasSimuladas },
    limitacoes: ["Não mede Vercel, Render, PostgreSQL, RLS, rede pública, TLS, sessão autenticada ou envio de e-mail reais.", "Gerador, API e simulador compartilham CPU e memória; a máquina geradora pode ser o gargalo.", "São clientes HTTP, não navegadores completos nem usuários humanos simultâneos.", "O maior nível ensaiado não comprova o limite de capacidade nem suporte a 50 milhões de usuários.", "Percentis são calculados sobre todas as chamadas concluídas, incluindo falhas e timeouts; vazão inclui o tempo de drenagem."],
    rotas, etapas, encerramento,
  };
  const destino = new URL("../frontend/publico/diagnosticos/carga.json", import.meta.url);
  await mkdir(new URL(".", destino), { recursive: true });
  await writeFile(destino, JSON.stringify(relatorio, null, 2) + "\n");
  console.log("Relatório agregado salvo em frontend/publico/diagnosticos/carga.json; produção não recebeu carga.");
} catch (erro) {
  console.error(erro instanceof Error ? erro.message : "Falha no ensaio isolado."); process.exitCode = 1;
} finally {
  clearTimeout(limiteTempo);
  controlador.abort();
  if (servidorApi && servidorApi.exitCode === null && servidorApi.signalCode === null) {
    const terminou = new Promise((resolver) => servidorApi.once("exit", resolver));
    servidorApi.kill(); await terminou;
  }
  simulador.closeAllConnections();
  if (simulador.listening) await new Promise((resolver) => simulador.close(resolver));
  process.removeListener("SIGINT", interromper); process.removeListener("SIGTERM", interromper);
}
