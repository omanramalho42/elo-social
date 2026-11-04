import { ApiError, ipDe, lerJson, ok, rota } from "@/lib/http";
import { limitar } from "@/lib/ratelimit";
import { supabaseDoUsuario } from "@/lib/supabase/server";
import { recuperarSenhaSchema } from "@/lib/validators";

// "Esqueci minha senha": envia o e-mail de recuperação. A resposta é sempre a mesma (não revela se o e-mail existe).
export const POST = rota(async (req) => {
  limitar(`recuperar:${ipDe(req)}`, 5, 60 * 60 * 1000);
  const { email } = recuperarSenhaSchema.parse(await lerJson(req));
  const enderecoFrontend = process.env.FRONTEND_URL || process.env.SITE_URL;
  const { error } = await supabaseDoUsuario().auth.resetPasswordForEmail(email, {
    redirectTo: `${enderecoFrontend}/redefinir-senha`,
  });
  if (error) throw new ApiError(503, "Não foi possível enviar as instruções agora. Tente novamente mais tarde.");
  return ok({ mensagem: "Se o e-mail estiver cadastrado, enviamos as instruções de recuperação." });
});

export const dynamic = "force-dynamic";
