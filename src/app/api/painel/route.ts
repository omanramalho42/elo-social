import { exigirUsuario } from "@/lib/auth";
import { ApiError, lerJson, ok, rota } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { confirmarExclusaoSchema, painelSchema } from "@/lib/validators";

const CAMPOS =
  "id, nome, bairro, area, descricao, endereco, contato, cnpj, site, status, verificacao, motivo_rejeicao, projetos(id, nome, descricao)";

// Dados da ONG do usuário logado (resumo + formulário + projetos).
export const GET = rota(async () => {
  const { supabase, user } = await exigirUsuario();
  const { data, error } = await supabase.from("ongs").select(CAMPOS).eq("owner_id", user.id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "Sua conta ainda não está vinculada a uma ONG. A equipe faz o vínculo após a conferência.");
  return ok(data);
});

// Salvar alterações. O RLS + gatilho do banco impedem mexer em status, dono ou posição.
export const PATCH = rota(async (req) => {
  const { supabase, user } = await exigirUsuario();
  const dados = painelSchema.parse(await lerJson(req));
  const { data, error } = await supabase
    .from("ongs")
    .update(dados)
    .eq("owner_id", user.id)
    .select("id, nome, bairro, area, descricao, endereco, contato, site, status")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "Nenhuma ONG vinculada a esta conta.");
  return ok(data);
});

// Excluir a própria ONG (DELETE): apaga a ONG, os projetos, o CNPJ (cascata) e o login.
export const DELETE = rota(async (req) => {
  const { supabase, user } = await exigirUsuario();
  confirmarExclusaoSchema.parse(await lerJson(req));

  const { data, error } = await supabase.from("ongs").delete().eq("owner_id", user.id).select("id");
  if (error) throw error;
  if (!data?.length) throw new ApiError(404, "Nenhuma ONG vinculada a esta conta.");

  await supabaseAdmin().auth.admin.deleteUser(user.id); // libera o e-mail para um novo cadastro
  await supabase.auth.signOut();
  return ok({ mensagem: "ONG e conta excluídas." });
});

export const dynamic = "force-dynamic";
