import { ErroApi, lerJson, ok, rota } from "@/biblioteca/http";
import { supabaseAdministrador } from "@/biblioteca/supabase/administrador";
import { cadastroOngSchema } from "@/biblioteca/validacoes";

// Tela "Cadastrar ONG": envia o pedido para conferência. NÃO publica e NÃO cria acesso de gestor.
export const POST = rota(async (requisicao) => {
  const d = cadastroOngSchema.parse(await lerJson(requisicao));
  const administrador = supabaseAdministrador();

  const { data: existente } = await administrador
    .from("ongs")
    .select("id")
    .eq("cnpj", d.cnpj)
    .maybeSingle();
  if (existente) throw new ErroApi(409, "Já existe um cadastro com esse CNPJ.");

  const { data: ong, error: erro } = await administrador
    .from("ongs")
    .insert({
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
