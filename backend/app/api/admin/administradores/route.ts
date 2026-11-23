import { exigirAdministrador } from "@/biblioteca/autenticacao";
import { supabaseAdministrador } from "@/biblioteca/supabase/administrador";
import { ErroApi, lerJson, ok, rota } from "@/biblioteca/http";
import { novoAdministradorSchema } from "@/biblioteca/validacoes";

export const GET = rota(async () => {
  const { supabase } = await exigirAdministrador();
  const { data, error } = await supabase.from("perfis").select("user_id, nome, email").eq("papel", "admin").order("nome");
  if (error) throw error;
  return ok(data || []);
});

export const POST = rota(async (requisicao) => {
  await exigirAdministrador();
  const dados = novoAdministradorSchema.parse(await lerJson(requisicao));
  const servidor = supabaseAdministrador();
  const { data: perfil, error } = await servidor.from("perfis").select("user_id, papel").eq("email", dados.email).maybeSingle();
  if (error) throw error;
  if (!perfil) throw new ErroApi(404, "Conta não encontrada. A pessoa deve criar um acesso e confirmar o e-mail primeiro.");
  if (perfil.papel === "admin") throw new ErroApi(409, "Esta conta já é administradora.");
  const { data: conta, error: erroConta } = await servidor.auth.admin.getUserById(perfil.user_id);
  if (erroConta || !conta.user) throw new ErroApi(503, "Não foi possível conferir a conta. Tente novamente.");
  if (!conta.user.email_confirmed_at) throw new ErroApi(422, "A pessoa precisa confirmar o e-mail antes de receber acesso administrativo.");
  const { data: ong, error: erroOng } = await servidor.from("ongs").select("id").eq("owner_id", perfil.user_id).maybeSingle();
  if (erroOng) throw erroOng;
  if (ong) throw new ErroApi(409, "Esta conta é gestora de uma ONG. Use uma conta separada para a administração.");
  const { data: atualizado, error: erroAtualizacao } = await servidor.from("perfis").update({ papel: "admin" }).eq("user_id", perfil.user_id).eq("papel", "ong").select("nome, email").maybeSingle();
  if (erroAtualizacao) throw erroAtualizacao;
  if (!atualizado) throw new ErroApi(409, "O perfil foi alterado durante a operação. Atualize a lista.");
  return ok({ mensagem: "Administrador adicionado. A pessoa já pode entrar com sua própria conta.", administrador: atualizado }, 201);
});

export const dynamic = "force-dynamic";
