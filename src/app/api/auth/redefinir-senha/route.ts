import { exigirUsuario } from "@/lib/auth";
import { ApiError, lerJson, ok, rota } from "@/lib/http";
import { redefinirSenhaSchema } from "@/lib/validators";

// Define a nova senha (usuário logado, inclusive vindo do link de recuperação).
export const POST = rota(async (req) => {
  const { supabase } = await exigirUsuario();
  const { senha } = redefinirSenhaSchema.parse(await lerJson(req));
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) throw new ApiError(400, "Não foi possível alterar a senha.");
  return ok({ mensagem: "Senha alterada." });
});

export const dynamic = "force-dynamic";
