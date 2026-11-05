import { exigirUsuario } from "@/biblioteca/autenticacao";
import { ErroApi, lerJson, ok, rota } from "@/biblioteca/http";
import { redefinirSenhaSchema } from "@/biblioteca/validacoes";

// Define a nova senha (usuário conectado, inclusive vindo do endereço de recuperação).
export const POST = rota(async (requisicao) => {
  const { supabase } = await exigirUsuario();
  const { senha } = redefinirSenhaSchema.parse(await lerJson(requisicao));
  const { error: erro } = await supabase.auth.updateUser({ password: senha });
  if (erro) throw new ErroApi(400, "Não foi possível alterar a senha.");
  await supabase.auth.signOut({ scope: "local" });
  return ok({ mensagem: "Senha alterada. Entre novamente com a nova senha." });
});

export const dynamic = "force-dynamic";
