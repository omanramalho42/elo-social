import { ApiError, ipDe, lerJson, ok, rota } from "@/lib/http";
import { limitar } from "@/lib/ratelimit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cadastroOngSchema } from "@/lib/validators";

// Tela "Cadastrar ONG": envia o pedido para conferência. NÃO publica e NÃO cria acesso de gestor.
export const POST = rota(async (req) => {
  limitar(`cadastro:${ipDe(req)}`, 5, 60 * 60 * 1000);
  const d = cadastroOngSchema.parse(await lerJson(req));
  const admin = supabaseAdmin();

  if (d.cnpj) {
    const { data: existente } = await admin.from("ongs").select("id").eq("cnpj", d.cnpj).maybeSingle();
    if (existente) throw new ApiError(409, "Já existe um cadastro com esse CNPJ.");
  }

  const { data: ong, error } = await admin
    .from("ongs")
    .insert({
      nome: d.nome, cnpj: d.cnpj ?? null, descricao: d.descricao, area: d.area, bairro: d.bairro,
      endereco: d.endereco ?? null, contato: d.contato, site: d.site ?? null,
    })
    .select("id")
    .single();
  if (error || !ong) throw error ?? new Error("falha ao criar ONG");

  const { error: erroPrivado } = await admin
    .from("ongs_privado")
    .insert({ ong_id: ong.id, responsavel: d.responsavel, referencias: d.referencias });
  if (erroPrivado) {
    await admin.from("ongs").delete().eq("id", ong.id);
    throw erroPrivado;
  }

  return ok(
    { mensagem: "Pedido enviado para conferência. A ONG só aparece no site depois da publicação pela equipe.", protocolo: ong.id },
    201,
  );
});

export const dynamic = "force-dynamic";
