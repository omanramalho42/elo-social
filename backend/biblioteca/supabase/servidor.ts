import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { configuracaoSupabase } from "../configuracao";

/** Cliente com a sessão do usuário: TODAS as consultas passam pelo RLS do banco. */
export async function supabaseDoUsuario() {
  const store = await cookies();
  const configuracao = configuracaoSupabase();
  return createServerClient(
    configuracao.url,
    configuracao.anon,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (lista) => {
          try {
            lista.forEach(({ name, value, options }) =>
              store.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
              }),
            );
          } catch {
            /* chamado fora de rota: ignorar */
          }
        },
      },
    },
  );
}
