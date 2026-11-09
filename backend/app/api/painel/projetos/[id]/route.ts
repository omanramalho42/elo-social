import { exigirGestorAprovado } from "@/biblioteca/autenticacao";
import { ErroApi, lerJson, ok, rota } from "@/biblioteca/http";
import { idSchema, projetoSchema } from "@/biblioteca/validacoes";

// O RLS só deixa apagar projetos da própria ONG; de outra ONG simplesmente não encontra nada.
export const DELETE = rota(
  async (_req, { params: parametros }: { params: { id: string } }) => {
    const { supabase } = await exigirGestorAprovado();
    const id = idSchema.safeParse(parametros.id);
    if (!id.success) throw new ErroApi(404, "Projeto não encontrado.");

    const { data: dados, error: erro } = await supabase
      .from("projetos")
      .delete()
      .eq("id", id.data)
      .select("id");
    if (erro) throw erro;
    if (!dados?.length) throw new ErroApi(404, "Projeto não encontrado.");
    return ok({ mensagem: "Projeto removido." });
  },
);

// Editar o nome de um projeto (UPDATE). O RLS só permite nos projetos da própria ONG.
export const PATCH = rota(
  async (requisicao, { params: parametros }: { params: { id: string } }) => {
    const { supabase } = await exigirGestorAprovado();
    const id = idSchema.safeParse(parametros.id);
    if (!id.success) throw new ErroApi(404, "Projeto não encontrado.");
    const dados = projetoSchema.parse(await lerJson(requisicao));

    const { data, error: erro } = await supabase
      .from("projetos")
      .update(dados)
      .eq("id", id.data)
      .select("id, nome, descricao");
    if (erro) throw erro;
    if (!data?.length) throw new ErroApi(404, "Projeto não encontrado.");
    return ok(data[0]);
  },
);

export const dynamic = "force-dynamic";
