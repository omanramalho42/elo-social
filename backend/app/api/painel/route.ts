import { exigirGestorAprovado, exigirUsuario } from "@/biblioteca/autenticacao";
import { ErroApi, lerJson, ok, rota } from "@/biblioteca/http";
import { supabaseAdministrador } from "@/biblioteca/supabase/administrador";
import { confirmarExclusaoSchema, painelSchema } from "@/biblioteca/validacoes";

const CAMPOS =
  "id, nome, bairro, area, descricao, endereco, contato, cnpj, site, status, verificacao, motivo_rejeicao, projetos(id, nome, descricao)";

// Dados da ONG do usuário logado (resumo + formulário + projetos).
export const GET = rota(async () => {
  const { supabase, user: usuario } = await exigirUsuario();
  const { data: dados, error: erro } = await supabase
    .from("ongs")
    .select(CAMPOS)
    .eq("owner_id", usuario.id)
    .maybeSingle();
  if (erro) throw erro;
  if (!dados) return ok({ situacao: "sem_ong" });
  return ok(dados);
});

// Salvar alterações. O RLS e o gatilho do banco impedem mexer na situação, no dono ou na posição.
export const PATCH = rota(async (requisicao) => {
  const { supabase, user: usuario } = await exigirGestorAprovado();
  const dados = painelSchema.parse(await lerJson(requisicao));
  const { data, error: erro } = await supabase
    .from("ongs")
    .update(dados)
    .eq("owner_id", usuario.id)
    .select(
      "id, nome, bairro, area, descricao, endereco, contato, site, status",
    )
    .maybeSingle();
  if (erro) throw erro;
  if (!data) throw new ErroApi(404, "Nenhuma ONG vinculada a esta conta.");
  return ok(data);
});

// Excluir a própria ONG: apaga a ONG, os projetos, o CNPJ (cascata) e a conta.
export const DELETE = rota(async (requisicao) => {
  const { supabase, user: usuario } = await exigirUsuario();
  confirmarExclusaoSchema.parse(await lerJson(requisicao));

  const { data: dados, error: erro } = await supabase
    .from("ongs")
    .delete()
    .eq("owner_id", usuario.id)
    .select("id");
  if (erro) throw erro;
  if (!dados?.length)
    throw new ErroApi(404, "Nenhuma ONG vinculada a esta conta.");

  await supabaseAdministrador().auth.admin.deleteUser(usuario.id); // libera o e-mail para um novo cadastro
  await supabase.auth.signOut();
  return ok({ mensagem: "ONG e conta excluídas." });
});

export const dynamic = "force-dynamic";
