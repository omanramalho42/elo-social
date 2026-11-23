export function resumirAmostras(amostras, duracaoMs) {
  if (!Number.isFinite(duracaoMs) || duracaoMs <= 0) throw new Error("Duração inválida.");
  if (amostras.some((a) => !Number.isFinite(a.ms) || a.ms < 0 || typeof a.sucesso !== "boolean")) throw new Error("Amostra inválida.");
  const ordenadas = amostras.map((a) => a.ms).sort((a, b) => a - b);
  const total = amostras.length;
  const sucessos = amostras.filter((a) => a.sucesso).length;
  const percentil = (p) => total ? Math.round(ordenadas[Math.ceil(total * p) - 1] * 100) / 100 : null;
  return {
    total, sucessos, erros: total - sucessos, taxaErro: total ? (total - sucessos) / total : null,
    requisicoesPorSegundo: Math.round(total * 100000 / duracaoMs) / 100,
    sucessosPorSegundo: Math.round(sucessos * 100000 / duracaoMs) / 100,
    p50Ms: percentil(.5), p95Ms: percentil(.95), p99Ms: percentil(.99),
  };
}
