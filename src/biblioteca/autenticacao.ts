import { ErroApi } from "./http";
import { supabaseDoUsuario } from "./supabase/servidor";
import { confirmarEnderecoSchema } from "./validacoes";
import { z } from "zod";

export async function confirmarEndereco(
  dados: z.infer<typeof confirmarEnderecoSchema>,
  mensagemErro: string,
) {
  const supabase = supabaseDoUsuario();
  let resultado;
  try {
    resultado =
      "codigo" in dados
        ? await supabase.auth.exchangeCodeForSession(dados.codigo)
        : await supabase.auth.setSession({
            access_token: dados.tokenAcesso,
            refresh_token: dados.tokenRenovacao,
          });
  } catch {
    throw new ErroApi(400, mensagemErro);
  }
  if (resultado.error || !resultado.data.session)
    throw new ErroApi(400, mensagemErro);
  const { data: verificacao, error: erroVerificacao } =
    await supabase.auth.getUser();
  if (erroVerificacao || !verificacao.user) {
    await supabase.auth.signOut({ scope: "local" });
    throw new ErroApi(400, mensagemErro);
  }
}

export async function exigirUsuario() {
  const supabase = supabaseDoUsuario();
  const { data: dados, error: erro } = await supabase.auth.getUser(); // valida o token no servidor do Supabase
  if (erro || !dados.user) throw new ErroApi(401, "Entre na sua conta para continuar.");
  return { supabase, user: dados.user };
}

export async function exigirAdministrador() {
  const contexto = await exigirUsuario();
  const { data: dados } = await contexto.supabase
    .from("perfis")
    .select("papel")
    .eq("user_id", contexto.user.id)
    .maybeSingle();
  if (dados?.papel !== "admin")
    throw new ErroApi(403, "Acesso restrito à equipe.");
  return contexto;
}

export async function exigirGestorAprovado() {
  const contexto = await exigirUsuario();
  const { data: ong, error: erro } = await contexto.supabase
    .from("ongs")
    .select("id, status")
    .eq("owner_id", contexto.user.id)
    .maybeSingle();
  if (erro) throw erro;
  if (!ong) throw new ErroApi(404, "Nenhuma ONG vinculada a esta conta.");
  if (ong.status !== "aprovada")
    throw new ErroApi(
      403,
      "Aguarde a aprovação da ONG para editar dados e projetos.",
    );
  return { ...contexto, ong };
}
