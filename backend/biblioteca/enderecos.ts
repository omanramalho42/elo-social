type Ambiente = {
  NODE_ENV?: string;
  SITE_URL?: string;
  FRONTEND_URL?: string;
};

// Domínios oficiais, também usados nos rewrites versionados da Vercel.
// Valores explícitos do ambiente continuam permitindo outra hospedagem.
export function enderecosAplicacao(ambiente: Ambiente = process.env) {
  const producao = ambiente.NODE_ENV === "production";
  const origem = (valor: string) => {
    const url = new URL(valor.trim());
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
      throw new Error("Endereço da aplicação inválido. Confira SITE_URL e FRONTEND_URL.");
    return url.origin;
  };
  return {
    backend: origem(ambiente.SITE_URL || (producao
      ? "https://elo-social-6qwo.vercel.app"
      : "http://localhost:3000")),
    frontend: origem(ambiente.FRONTEND_URL || (producao
      ? "https://elo-social-chi.vercel.app"
      : "http://127.0.0.1:5173")),
  };
}
