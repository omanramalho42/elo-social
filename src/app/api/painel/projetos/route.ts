import { exigirGestorAprovado, exigirUsuario } from "@/biblioteca/autenticacao";
import { ErroApi, lerJson, ok, rota } from "@/biblioteca/http";
import { projetoSchema } from "@/biblioteca/validacoes";

// Lista os projetos da ONG do gestor logado (Read).
export const GET = rota(async () => {
  const { supabase, user: usuario } = await exigirUsuario();
  const { data: ong } = await supabase
    .from("ongs")
    .select("id")
    .eq("owner_id", usuario.id)
    .maybeSingle();
  if (!ong) throw new ErroApi(404, "Nenhuma ONG vinculada a esta conta.");

  const { data: dados, error: erro } = await supabase
    .from("projetos")
    .select("id, nome, descricao")
    .eq("ong_id", ong.id)
    .order("id");
  if (erro) throw erro;
  return ok(dados);
});

export const POST = rota(async (requisicao) => {
  const { supabase, user: usuario } = await exigirGestorAprovado();
  const { nome, descricao } = projetoSchema.parse(await lerJson(requisicao));

  const { data: ong } = await supabase
    .from("ongs")
    .select("id")
    .eq("owner_id", usuario.id)
    .maybeSingle();
  if (!ong) throw new ErroApi(404, "Nenhuma ONG vinculada a esta conta.");

  const { data: dados, error: erro } = await supabase
    .from("projetos")
    .insert({ ong_id: ong.id, nome, descricao: descricao ?? null })
    .select("id, nome, descricao")
    .single();
  if (erro) {
    if (erro.message.includes("Limite"))
      throw new ErroApi(422, "Limite de 30 projetos atingido.");
    throw erro;
  }
  return ok(dados, 201);
});

export const dynamic = "force-dynamic";
