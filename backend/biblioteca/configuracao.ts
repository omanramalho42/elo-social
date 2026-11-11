import { ErroApi } from "./http";

/** Retorna as chaves somente no servidor. Erros nunca incluem seus valores. */
export function configuracaoSupabase(ambiente: Record<string, string | undefined> = process.env) {
  const url = ambiente.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = ambiente.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceRole = ambiente.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !anon || !serviceRole || /SEU-PROJETO/i.test(url) ||
      /chave-anon|sua-chave/i.test(anon) || /chave-service-role|sua-chave/i.test(serviceRole)) {
    throw new ErroApi(503, "O servidor ainda não está configurado. Avise a equipe responsável.");
  }
  try {
    const endereco = new URL(url);
    if (!["https:", "http:"].includes(endereco.protocol) || endereco.username || endereco.password)
      throw new Error();
  } catch {
    throw new ErroApi(503, "O servidor ainda não está configurado. Avise a equipe responsável.");
  }
  return { url, anon, serviceRole };
}
