import { ok, rota } from "@/biblioteca/http";
import { supabaseDoUsuario } from "@/biblioteca/supabase/servidor";

export const POST = rota(async () => {
  await supabaseDoUsuario().auth.signOut();
  return ok({ mensagem: "Sessão encerrada." });
});

export const dynamic = "force-dynamic";
