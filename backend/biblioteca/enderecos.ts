type Ambiente = {
  NODE_ENV?: string;
  SITE_URL?: string;
  FRONTEND_URL?: string;
};

// Domínios oficiais, também usados nos rewrites versionados da Vercel.
// Valores explícitos do ambiente continuam permitindo outra hospedagem.
export function enderecosAplicacao(ambiente: Ambiente = process.env) {
  const producao = ambiente.NODE_ENV === "production";
  return {
    backend: ambiente.SITE_URL || (producao
      ? "https://elo-social-6qwo.vercel.app"
      : "http://localhost:3000"),
    frontend: ambiente.FRONTEND_URL || (producao
      ? "https://elo-social-chi.vercel.app"
      : "http://127.0.0.1:5173"),
  };
}
