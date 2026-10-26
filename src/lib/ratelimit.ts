import { ApiError } from "./http";

// Limite simples em memória. Em produção na Vercel (várias instâncias), troque por Upstash/Redis.
const janelas = new Map<string, { inicio: number; total: number }>();

export function limitar(chave: string, max: number, janelaMs: number) {
  const agora = Date.now();
  const j = janelas.get(chave);
  if (!j || agora - j.inicio > janelaMs) {
    janelas.set(chave, { inicio: agora, total: 1 });
  } else if (++j.total > max) {
    throw new ApiError(429, "Muitas tentativas. Aguarde um pouco e tente de novo.");
  }
  if (janelas.size > 10_000) {
    for (const [k, v] of janelas) if (agora - v.inicio > janelaMs) janelas.delete(k);
  }
}
