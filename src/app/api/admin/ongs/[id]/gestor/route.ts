import { exigirAdministrador } from "@/biblioteca/autenticacao";
import { ErroApi, lerJson, ok, rota } from "@/biblioteca/http";
import { gestorSchema, idSchema } from "@/biblioteca/validacoes";

// Vincula a conta de um gestor (pelo e-mail) a uma ONG. Só a equipe faz isso, depois da conferência.
export const POST = rota(
  async (requisicao, { params: parametros }: { params: { id: string } }) => {
    const { supabase } = await exigirAdministrador();
    const id = idSchema.safeParse(parametros.id);
    if (!id.success) throw new ErroApi(404, "ONG não encontrada.");
    const { email } = gestorSchema.parse(await lerJson(requisicao));

    const { data: perfil } = await supabase
      .from("perfis")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();
    if (!perfil) throw new ErroApi(404, "Nenhuma conta com esse e-mail.");

    const { data: dados, error: erro } = await supabase
      .from("ongs")
      .update({ owner_id: perfil.user_id })
      .eq("id", id.data)
      .select("id, owner_id");
    if (erro?.code === "23505")
      throw new ErroApi(409, "Esse gestor já está vinculado a outra ONG.");
    if (erro) throw erro;
    if (!dados?.length) throw new ErroApi(404, "ONG não encontrada.");
    return ok({ mensagem: "Gestor vinculado.", ongId: dados[0].id });
  },
);

// Remove o vínculo do gestor com a ONG.
export const DELETE = rota(
  async (_req, { params: parametros }: { params: { id: string } }) => {
    const { supabase } = await exigirAdministrador();
    const id = idSchema.safeParse(parametros.id);
    if (!id.success) throw new ErroApi(404, "ONG não encontrada.");
    const { data: dados, error: erro } = await supabase
      .from("ongs")
      .update({ owner_id: null })
      .eq("id", id.data)
      .select("id");
    if (erro) throw erro;
    if (!dados?.length) throw new ErroApi(404, "ONG não encontrada.");
    return ok({ mensagem: "Vínculo removido." });
  },
);

export const dynamic = "force-dynamic";
