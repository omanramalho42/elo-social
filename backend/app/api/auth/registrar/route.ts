import { lerJson, ok, rota, ErroApi } from "@/biblioteca/http";
import { supabaseAdministrador } from "@/biblioteca/supabase/administrador";
import { supabaseDoUsuario } from "@/biblioteca/supabase/servidor";
import { registrarSchema } from "@/biblioteca/validacoes";
import { enderecosAplicacao } from "@/biblioteca/enderecos";

const RESPOSTA = {
  mensagem:
    "Conta criada! Confirme seu e-mail, entre na conta e cadastre sua ONG para conferência.",
};

// Tela "Área da ONG > Cadastre-se": cria a conta de gestor (ainda sem ONG vinculada).
export const POST = rota(async (requisicao) => {
  const d = registrarSchema.parse(await lerJson(requisicao));

  const enderecoInterface = enderecosAplicacao().frontend;
  const { data: dados, error: erro } = await supabaseDoUsuario().auth.signUp({
    email: d.email,
    password: d.senha,
    options: { emailRedirectTo: `${enderecoInterface}/confirmar-email` },
  });
  if (erro?.status === 429)
    throw new ErroApi(
      429,
      "O Supabase atingiu o limite temporário de envio de e-mails. Aguarde a liberação do serviço para criar a conta.",
    );
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
