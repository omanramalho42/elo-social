import { ErroApi, lerJson, ok, rota } from "@/biblioteca/http";
import { supabaseDoUsuario } from "@/biblioteca/supabase/servidor";
import { confirmarRecuperacaoSchema } from "@/biblioteca/validacoes";

// Troca o código de uso único do endereço pela sessão guardada em cookie HttpOnly.
export const POST = rota(async (requisicao) => {
  const { codigo } = confirmarRecuperacaoSchema.parse(
    await lerJson(requisicao),
  );
  const { data: dados, error: erro } =
    await supabaseDoUsuario().auth.exchangeCodeForSession(codigo);
  if (erro || !dados.session) {
    throw new ErroApi(
      400,
      "Endereço inválido ou expirado. Solicite outro no mesmo navegador em que vai abrir o e-mail.",
    );
  }
  return ok({ mensagem: "Endereço confirmado. Defina sua nova senha." });
});

export const dynamic = "force-dynamic";
