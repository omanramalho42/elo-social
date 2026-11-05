import { ErroApi, lerJson, ok, rota } from "@/biblioteca/http";
import { supabaseDoUsuario } from "@/biblioteca/supabase/servidor";
import { confirmarRecuperacaoSchema } from "@/biblioteca/validacoes";

// O código de confirmação é trocado por uma sessão no mesmo navegador do cadastro.
export const POST = rota(async (requisicao) => {
  const { codigo } = confirmarRecuperacaoSchema.parse(
    await lerJson(requisicao),
  );
  const { data: dados, error: erro } =
    await supabaseDoUsuario().auth.exchangeCodeForSession(codigo);
  if (erro || !dados.session)
    throw new ErroApi(
      400,
      "Endereço inválido ou expirado. Abra o e-mail no navegador usado no cadastro.",
    );
  return ok({ mensagem: "E-mail confirmado." });
});

export const dynamic = "force-dynamic";
