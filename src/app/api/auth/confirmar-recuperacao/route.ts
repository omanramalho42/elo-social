import { ApiError, ipDe, lerJson, ok, rota } from "@/lib/http";
import { limitar } from "@/lib/ratelimit";
import { supabaseDoUsuario } from "@/lib/supabase/server";
import { confirmarRecuperacaoSchema } from "@/lib/validators";

// Troca o código de uso único do link pela sessão guardada em cookie HttpOnly.
export const POST = rota(async (req) => {
  limitar(`confirmar-recuperacao:${ipDe(req)}`, 10, 15 * 60 * 1000);
  const { codigo } = confirmarRecuperacaoSchema.parse(await lerJson(req));
  const { data, error } = await supabaseDoUsuario().auth.exchangeCodeForSession(codigo);
  if (error || !data.session) {
    throw new ApiError(400, "Link inválido ou expirado. Solicite outro link no mesmo navegador em que vai abrir o e-mail.");
  }
  return ok({ mensagem: "Link confirmado. Defina sua nova senha." });
});

export const dynamic = "force-dynamic";
