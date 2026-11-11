import { ok, rota } from "@/biblioteca/http";
import { supabaseDoUsuario } from "@/biblioteca/supabase/servidor";

export const POST = rota(async () => {
  const { error: erro } = await (await supabaseDoUsuario()).auth.signOut({ scope: "local" });
  if (erro) throw erro;
  return ok({ mensagem: "Sessão encerrada." });
});

export const dynamic = "force-dynamic";
