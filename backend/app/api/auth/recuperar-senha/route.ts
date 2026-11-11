import { ErroApi, lerJson, ok, rota } from "@/biblioteca/http";
import { supabaseDoUsuario } from "@/biblioteca/supabase/servidor";
import { recuperarSenhaSchema } from "@/biblioteca/validacoes";
import { enderecosAplicacao } from "@/biblioteca/enderecos";

// "Esqueci minha senha": envia o e-mail de recuperação. A resposta é sempre a mesma (não revela se o e-mail existe).
export const POST = rota(async (requisicao) => {
  const { email } = recuperarSenhaSchema.parse(await lerJson(requisicao));
  const enderecoFrontend = enderecosAplicacao().frontend;
  const { error: erro } = await supabaseDoUsuario().auth.resetPasswordForEmail(
    email,
    {
      redirectTo: `${enderecoFrontend}/redefinir-senha`,
    },
  );
  if (erro?.status === 429)
    throw new ErroApi(
      429,
      "O Supabase atingiu o limite temporário de envio de e-mails. Aguarde para solicitar outra recuperação.",
    );
  if (erro)
    throw new ErroApi(
      503,
      "Não foi possível enviar as instruções agora. Tente novamente mais tarde.",
    );
  return ok({
    mensagem:
      "Se o e-mail estiver cadastrado, enviamos as instruções de recuperação.",
  });
});

export const dynamic = "force-dynamic";
