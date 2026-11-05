import { lerJson, ok, rota, ErroApi } from "@/biblioteca/http";
import { supabaseAdministrador } from "@/biblioteca/supabase/administrador";
import { supabaseDoUsuario } from "@/biblioteca/supabase/servidor";
import { registrarSchema } from "@/biblioteca/validacoes";

const RESPOSTA = {
  mensagem:
    "Conta criada! Confirme seu e-mail. A equipe vincula sua conta a uma ONG depois da conferência.",
};

// Tela "Área da ONG > Cadastre-se": cria a conta de gestor (ainda sem ONG vinculada).
export const POST = rota(async (requisicao) => {
  const d = registrarSchema.parse(await lerJson(requisicao));

  const enderecoInterface = process.env.FRONTEND_URL || process.env.SITE_URL;
  const { data: dados, error: erro } = await supabaseDoUsuario().auth.signUp({
    email: d.email,
    password: d.senha,
    options: { emailRedirectTo: `${enderecoInterface}/confirmar-email` },
  });
  if (erro || !dados.user)
    throw new ErroApi(
      400,
      "Não foi possível criar a conta. Revise o e-mail e a senha.",
    );
  if (dados.user.identities?.length === 0) return ok(RESPOSTA, 201); // não revela que o e-mail já existe

  const administrador = supabaseAdministrador();
  const { error: erroPerfil } = await administrador.from("perfis").insert({
    user_id: dados.user.id,
    papel: "ong",
    nome: d.nome,
    email: d.email,
    telefone: d.telefone,
  });
  if (erroPerfil) {
    await administrador.auth.admin.deleteUser(dados.user.id);
    throw erroPerfil;
  }
  return ok(RESPOSTA, 201);
});

export const dynamic = "force-dynamic";
