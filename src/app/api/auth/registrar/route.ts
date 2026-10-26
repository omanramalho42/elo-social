import { ipDe, lerJson, ok, rota, ApiError } from "@/lib/http";
import { limitar } from "@/lib/ratelimit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseDoUsuario } from "@/lib/supabase/server";
import { registrarSchema } from "@/lib/validators";

const RESPOSTA = {
  mensagem: "Conta criada! Confirme seu e-mail. A equipe vincula sua conta a uma ONG depois da conferência.",
};

// Tela "Área da ONG > Cadastre-se": cria a conta de gestor (ainda sem ONG vinculada).
export const POST = rota(async (req) => {
  limitar(`registrar:${ipDe(req)}`, 5, 60 * 60 * 1000);
  const d = registrarSchema.parse(await lerJson(req));

  const { data, error } = await supabaseDoUsuario().auth.signUp({ email: d.email, password: d.senha });
  if (error || !data.user) throw new ApiError(400, "Não foi possível criar a conta. Revise o e-mail e a senha.");
  if (data.user.identities?.length === 0) return ok(RESPOSTA, 201); // não revela que o e-mail já existe

  const admin = supabaseAdmin();
  const { error: erroPerfil } = await admin
    .from("perfis")
    .insert({ user_id: data.user.id, papel: "ong", nome: d.nome, email: d.email, telefone: d.telefone });
  if (erroPerfil) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw erroPerfil;
  }
  return ok(RESPOSTA, 201);
});

export const dynamic = "force-dynamic";
