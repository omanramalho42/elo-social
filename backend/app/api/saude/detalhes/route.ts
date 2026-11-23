import { createClient } from "@supabase/supabase-js";
import { configuracaoSupabase } from "@/biblioteca/configuracao";
import { inventarioRotas, publicacaoPublica, sondar } from "@/biblioteca/diagnostico";
import pacote from "@/package.json";

export async function GET() {
  let projeto: string | null = null;
  let banco: { situacao: "ok" | "indisponivel"; duracaoMs: number } = { situacao: "indisponivel", duracaoMs: 0 };
  let autenticacao = banco;
  try {
    const { url, anon } = configuracaoSupabase();
    projeto = new URL(url).origin;
    const cliente = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    [banco, autenticacao] = await Promise.all([
      sondar(async () => {
        const { error } = await cliente.from("ongs").select("id", { head: true }).abortSignal(AbortSignal.timeout(5000));
        if (error) throw error;
      }),
      sondar(async () => {
        const resposta = await fetch(new URL("/auth/v1/health", url), { headers: { apikey: anon }, signal: AbortSignal.timeout(5000), cache: "no-store" });
        if (!resposta.ok) throw new Error();
        await resposta.body?.cancel();
      }),
    ]);
  } catch { /* Configuração inválida: relatório parcial, sem detalhes internos. */ }
  const situacao = banco.situacao === "ok" && autenticacao.situacao === "ok" ? "ok" : "parcial";
  return Response.json({
    situacao, verificadoEm: new Date().toISOString(),
    publicacao: { ...publicacaoPublica(), versao: pacote.version, framework: `Next.js ${pacote.dependencies.next}`, node: process.version },
    servicos: { api: { situacao: "ok" }, banco, autenticacao },
    banco: { provedor: "Supabase", tecnologia: "PostgreSQL", projeto },
    rotas: inventarioRotas(),
    alcance: "Consultas de leitura: resposta da API, acesso público ao banco e saúde do Supabase Auth. Não executa cadastros, aprovações, login ou envio de e-mails.",
  }, { status: situacao === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}

export const dynamic = "force-dynamic";
