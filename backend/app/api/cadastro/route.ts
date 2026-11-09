import { exigirUsuario } from "@/biblioteca/autenticacao";
import { ErroApi, lerJson, ok, rota } from "@/biblioteca/http";
import { supabaseAdministrador } from "@/biblioteca/supabase/administrador";
import { cadastroOngSchema } from "@/biblioteca/validacoes";

// A conta de gestor envia sua ONG para conferência; a equipe decide a publicação.
export const POST = rota(async (requisicao) => {
  const { supabase, user: usuario } = await exigirUsuario();
  const { data: perfil, error: erroPerfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("user_id", usuario.id)
    .maybeSingle();
  if (erroPerfil) throw erroPerfil;
  if (perfil?.papel !== "ong")
    throw new ErroApi(403, "Somente contas de gestor podem cadastrar uma ONG.");

  const d = cadastroOngSchema.parse(await lerJson(requisicao));
  const administrador = supabaseAdministrador();

  const { data: propria, error: erroPropria } = await administrador
    .from("ongs")
    .select("id")
    .eq("owner_id", usuario.id)
    .maybeSingle();
  if (erroPropria) throw erroPropria;
  if (propria)
    throw new ErroApi(409, "Sua conta já está vinculada a uma ONG.");

  const { data: existente, error: erroExistente } = await administrador
    .from("ongs")
    .select("id")
    .eq("cnpj", d.cnpj)
    .maybeSingle();
  if (erroExistente) throw erroExistente;
  if (existente) throw new ErroApi(409, "Já existe um cadastro com esse CNPJ.");

  const { data: ong, error: erro } = await administrador
    .from("ongs")
    .insert({
      owner_id: usuario.id,
      nome: d.nome,
      cnpj: d.cnpj,
      descricao: d.descricao,
      area: d.area,
      bairro: d.bairro,
      endereco: d.endereco ?? null,
      contato: d.contato,
      site: d.site ?? null,
    })
    .select("id")
    .single();
  if (erro?.code === "23505")
    throw new ErroApi(409, "Essa conta ou esse CNPJ já possui uma ONG cadastrada.");
  if (erro || !ong) throw erro ?? new Error("falha ao criar ONG");

  const { error: erroPrivado } = await administrador
    .from("ongs_privado")
    .insert({
      ong_id: ong.id,
      responsavel: d.responsavel,
      referencias: d.referencias,
    });
  if (erroPrivado) {
    await administrador.from("ongs").delete().eq("id", ong.id);
    throw erroPrivado;
  }

  return ok(
    {
      mensagem:
        "Pedido enviado para conferência. A ONG só aparece no site depois da publicação pela equipe.",
      protocolo: ong.id,
    },
    201,
  );
});

export const dynamic = "force-dynamic";
