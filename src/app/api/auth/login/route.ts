import { ErroApi, lerJson, ok, rota } from "@/biblioteca/http";
import { supabaseDoUsuario } from "@/biblioteca/supabase/servidor";
import { entrarSchema } from "@/biblioteca/validacoes";

export const POST = rota(async (requisicao) => {
  const { email, senha } = entrarSchema.parse(await lerJson(requisicao));

  const { data: dados, error: erro } =
    await supabaseDoUsuario().auth.signInWithPassword({
      email,
      password: senha,
    });
  if (erro?.status === 429)
    throw new ErroApi(429, "Muitas tentativas no Supabase. Aguarde e tente entrar novamente.");
  if (erro || !dados.user)
    throw new ErroApi(401, "E-mail ou senha incorretos."); // mensagem única, de propósito
  return ok({ mensagem: "Entrada realizada." });
});

export const dynamic = "force-dynamic";
