import { createClient } from "@supabase/supabase-js";
import { configuracaoSupabase } from "../configuracao";

/** Cliente com a chave service_role: ignora o RLS. Use SÓ no servidor e só quando indispensável. */
export function supabaseAdministrador() {
  const configuracao = configuracaoSupabase();
  return createClient(
    configuracao.url,
    configuracao.serviceRole,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
