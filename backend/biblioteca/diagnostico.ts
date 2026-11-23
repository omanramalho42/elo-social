import { openapi } from "./openapi";
import { enderecosAplicacao } from "./enderecos";

type Ambiente = Record<string, string | undefined>;
export function publicacaoPublica(ambiente: Ambiente = process.env) {
  let enderecos: { frontend: string | null; backend: string | null };
  try { enderecos = enderecosAplicacao(ambiente); }
  catch { enderecos = { frontend: null, backend: null }; }
  const commit = ambiente.RENDER_GIT_COMMIT || ambiente.VERCEL_GIT_COMMIT_SHA || "";
  const ramo = ambiente.RENDER_GIT_BRANCH || ambiente.VERCEL_GIT_COMMIT_REF || "";
  return {
    ...enderecos,
    ambiente: ambiente.NODE_ENV === "production" ? "Produção" : "Desenvolvimento",
    plataforma: ambiente.RENDER === "true" ? "Render" : ambiente.VERCEL === "1" ? "Vercel" : "Node.js",
    commit: /^[a-f0-9]{7,40}$/i.test(commit) ? commit : null,
    ramo: /^[a-zA-Z0-9_./-]{1,100}$/.test(ramo) ? ramo : null,
  };
}

export function inventarioRotas() {
  const caminhos = openapi.paths as Record<string, Record<string, { summary?: string; security?: unknown[]; tags?: string[] }>>;
  const rotas = Object.entries(caminhos).flatMap(([caminho, metodos]) =>
    Object.entries(metodos).filter(([metodo]) => ["get", "post", "patch", "delete", "put"].includes(metodo)).map(([metodo, operacao]) => ({
      metodo: metodo.toUpperCase(), caminho, resumo: operacao.summary || caminho,
      acesso: caminho.startsWith("/api/admin/") ? "Administrador" : caminho.startsWith("/api/painel") ? "Gestor da ONG" : operacao.security?.length ? "Conta autenticada" : "Público",
      grupo: operacao.tags?.[0] || "Diagnóstico",
    })),
  );
  rotas.push({ metodo: "GET", caminho: "/api/openapi", resumo: "Especificação OpenAPI", acesso: "Público", grupo: "Diagnóstico" });
  return rotas.sort((a, b) => a.caminho.localeCompare(b.caminho) || a.metodo.localeCompare(b.metodo));
}

// Só publica o resultado da consulta. Exceções podem conter credenciais do provedor.
export async function sondar(consulta: () => Promise<unknown>) {
  const inicio = performance.now();
  try {
    await consulta();
    return { situacao: "ok" as const, duracaoMs: Math.round(performance.now() - inicio) };
  } catch {
    return { situacao: "indisponivel" as const, duracaoMs: Math.round(performance.now() - inicio) };
  }
}
