import { ApiError } from "./http";
import { supabaseDoUsuario } from "./supabase/server";

export async function exigirUsuario() {
  const supabase = supabaseDoUsuario();
  const { data, error } = await supabase.auth.getUser(); // valida o token no servidor do Supabase
  if (error || !data.user) throw new ApiError(401, "Faça login para continuar.");
  return { supabase, user: data.user };
}

export async function exigirAdmin() {
  const ctx = await exigirUsuario();
  const { data } = await ctx.supabase.from("perfis").select("papel").eq("user_id", ctx.user.id).maybeSingle();
  if (data?.papel !== "admin") throw new ApiError(403, "Acesso restrito à equipe.");
  return ctx;
}
