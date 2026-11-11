import { createClient } from "@supabase/supabase-js";
import { configuracaoSupabase } from "@/biblioteca/configuracao";
import { ok } from "@/biblioteca/http";

// Verifica configuração e leitura pública sem expor chaves nem dados do catálogo.
export async function GET() {
  try {
    const { url, anon } = configuracaoSupabase();
    const cliente = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await cliente.from("ongs").select("id", { head: true })
      .abortSignal(AbortSignal.timeout(5000));
    if (error) throw new Error();
    return ok({ situacao: "ok" });
  } catch {
    return ok({ situacao: "indisponivel" }, 503);
  }
}

export const dynamic = "force-dynamic";
