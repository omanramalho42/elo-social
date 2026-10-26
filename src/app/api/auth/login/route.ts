import { ApiError, ipDe, lerJson, ok, rota } from "@/lib/http";
import { limitar } from "@/lib/ratelimit";
import { supabaseDoUsuario } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators";

export const POST = rota(async (req) => {
  const ip = ipDe(req);
  limitar(`login-ip:${ip}`, 20, 15 * 60 * 1000);
  const { email, senha } = loginSchema.parse(await lerJson(req));
  limitar(`login-email:${email}`, 5, 15 * 60 * 1000); // trava força bruta em uma conta

  const { data, error } = await supabaseDoUsuario().auth.signInWithPassword({ email, password: senha });
  if (error || !data.user) throw new ApiError(401, "E-mail ou senha incorretos."); // mensagem única, de propósito
  return ok({ mensagem: "Login realizado." });
});

export const dynamic = "force-dynamic";
