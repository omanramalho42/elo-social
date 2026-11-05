// Todas as telas usam esta função para conversar com a API. As chaves do Supabase ficam no servidor.
export async function api(caminho, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(`/api${caminho}`, {
      ...opcoes,
      credentials: "include",
      headers: {
        ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
        ...opcoes.headers,
      },
      body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
    });
  } catch {
    throw new Error(
      "Não foi possível conectar. Confira se o servidor está ligado.",
    );
  }
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const detalhes = (dados.detalhes || [])
      .map((d) => `${d.campo || "Dados"}: ${d.mensagem}`)
      .join(" · ");
    const erro = new Error(
      [dados.erro || "Não foi possível concluir a operação.", detalhes]
        .filter(Boolean)
        .join(" "),
    );
    erro.fields = Object.fromEntries(
      (dados.detalhes || [])
        .filter((d) => d.campo)
        .map((d) => [d.campo, d.mensagem]),
    );
    erro.status = resposta.status;
    throw erro;
  }
  return dados;
}
export const AREAS = [
  "Educação",
  "Assistência social",
  "Meio ambiente",
  "Saúde",
  "Cultura",
];
