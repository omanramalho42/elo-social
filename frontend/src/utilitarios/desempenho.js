export function projetarDemanda(usuarios, chamadas, intervalo) {
  if (![usuarios, chamadas, intervalo].every(Number.isFinite) || !Number.isInteger(usuarios) || usuarios < 1 || usuarios > 1_000_000_000 || !Number.isInteger(chamadas) || chamadas < 1 || chamadas > 100 || intervalo <= 0 || intervalo > 3600) return null;
  return usuarios * chamadas / intervalo;
}

export function validarRelatorioCarga(dados) {
  const positivo = (n) => Number.isFinite(n) && n > 0;
  const inteiro = (n) => Number.isInteger(n) && n >= 0;
  const medicao = (r) => r && inteiro(r.total) && inteiro(r.erros) && inteiro(r.sucessos) && r.erros + r.sucessos === r.total &&
    Number.isFinite(r.sucessosPorSegundo) && r.sucessosPorSegundo >= 0 &&
    (r.total === 0 ? r.p95Ms === null && r.taxaErro === null :
      [r.p50Ms, r.p95Ms, r.p99Ms].every((n) => Number.isFinite(n) && n >= 0) && r.p50Ms <= r.p95Ms && r.p95Ms <= r.p99Ms && Math.abs(r.taxaErro - r.erros / r.total) < 1e-9);
  return Boolean(dados?.schema === 1 && dados.tipo === "local-isolado" && Number.isFinite(Date.parse(dados.geradoEm)) &&
    dados.metodologia?.producaoMedida === false && positivo(dados.metodologia.janelaPorEtapaMs) && positivo(dados.metodologia.timeoutMs) &&
    typeof dados.metodologia.modelo === "string" && typeof dados.ambiente?.banco === "string" && typeof dados.ambiente.next === "string" && typeof dados.ambiente.node === "string" &&
    positivo(dados.ambiente.processadoresLogicos) && positivo(dados.ambiente.memoriaTotalGiB) && positivo(dados.ambiente.registrosSinteticos) &&
    Number.isFinite(dados.ambiente.atrasoBancoMs) && dados.ambiente.atrasoBancoMs >= 0 &&
    (dados.commitBase === null || typeof dados.commitBase === "string" && /^[a-f0-9]{40}$/i.test(dados.commitBase)) &&
    Array.isArray(dados.limitacoes) && dados.limitacoes.every((t) => typeof t === "string") && typeof dados.encerramento === "string" &&
    Array.isArray(dados.rotas) && dados.rotas.length > 0 && dados.rotas.every((r) => typeof r === "string") && new Set(dados.rotas).size === dados.rotas.length &&
    Array.isArray(dados.etapas) && dados.etapas.length > 0 && new Set(dados.etapas.map((e) => e?.concorrencia)).size === dados.etapas.length &&
    dados.etapas.every((e) => e && Number.isInteger(e.concorrencia) && e.concorrencia > 0 && e.concorrencia <= 1000 && medicao(e.resumo) &&
      inteiro(e.causas?.http) && inteiro(e.causas?.conexaoOuTimeout) && e.causas.http + e.causas.conexaoOuTimeout === e.resumo.erros &&
      Array.isArray(e.rotas) && e.rotas.length === dados.rotas.length && dados.rotas.every((rota) => e.rotas.filter((r) => r?.rota === rota).length === 1) && e.rotas.every(medicao) &&
      e.resumo.total === e.rotas.reduce((soma, r) => soma + r.total, 0) && e.resumo.erros === e.rotas.reduce((soma, r) => soma + r.erros, 0)));
}
