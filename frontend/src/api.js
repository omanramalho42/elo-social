// Todas as telas usam esta função para conversar com a API. As chaves do Supabase ficam no backend.
export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error(
      "Não foi possível conectar. Confira se o backend está ligado.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = (data.detalhes || [])
      .map((d) => `${d.campo || "Dados"}: ${d.mensagem}`)
      .join(" · ");
    const error = new Error(
      [data.erro || "Não foi possível concluir a operação.", details]
        .filter(Boolean)
        .join(" "),
    );
    error.fields = Object.fromEntries((data.detalhes || []).filter(d => d.campo).map(d => [d.campo, d.mensagem]));
    error.status = response.status;
    throw error;
  }
  return data;
}
export const AREAS = [
  "Educação",
  "Assistência social",
  "Meio ambiente",
  "Saúde",
  "Cultura",
];
