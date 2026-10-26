import { ok, rota } from "@/lib/http";
import { supabaseDoUsuario } from "@/lib/supabase/server";

export const POST = rota(async () => {
  await supabaseDoUsuario().auth.signOut();
  return ok({ mensagem: "Sessão encerrada." });
});

export const dynamic = "force-dynamic";
