import { exigirAdministrador } from "@/biblioteca/autenticacao";
import { ErroApi, lerJson, ok, rota } from "@/biblioteca/http";
import { supabaseAdministrador } from "@/biblioteca/supabase/administrador";
import {
  confirmarExclusaoSchema,
  idSchema,
  moderacaoSchema,
} from "@/biblioteca/validacoes";

// Aprovar/publicar (informando a posição no mapa e a situação dos dados) ou rejeitar (com motivo).
export const PATCH = rota(
  async (requisicao, { params: parametros }: { params: { id: string } }) => {
    const { supabase } = await exigirAdministrador();
    const id = idSchema.safeParse(parametros.id);
    if (!id.success) throw new ErroApi(404, "ONG não encontrada.");
    const dados = moderacaoSchema.parse(await lerJson(requisicao));

    const mudanca =
      dados.acao === "aprovar"
        ? {
            status: "aprovada" as const,
            lat: dados.lat,
            lon: dados.lon,
            verificacao: dados.verificacao,
            motivo_rejeicao: null,
          }
        : { status: "rejeitada" as const, motivo_rejeicao: dados.motivo };

    const { data, error: erro } = await supabase
      .from("ongs")
      .update(mudanca)
      .eq("id", id.data)
      .select("id, status")
      .maybeSingle();
    if (erro) throw erro;
    if (!data) throw new ErroApi(404, "ONG não encontrada.");
    return ok(data);
  },
);

// A equipe pode excluir qualquer ONG (DELETE), por exemplo um cadastro falso.
export const DELETE = rota(
  async (requisicao, { params: parametros }: { params: { id: string } }) => {
    const { supabase } = await exigirAdministrador();
    const id = idSchema.safeParse(parametros.id);
    if (!id.success) throw new ErroApi(404, "ONG não encontrada.");
    confirmarExclusaoSchema.parse(await lerJson(requisicao));

    const { data: dados, error: erro } = await supabase
      .from("ongs")
      .delete()
      .eq("id", id.data)
      .select("id, owner_id");
    if (erro) throw erro;
    if (!dados?.length) throw new ErroApi(404, "ONG não encontrada.");

    if (dados[0].owner_id)
      await supabaseAdministrador().auth.admin.deleteUser(dados[0].owner_id);
    return ok({ mensagem: "ONG excluída." });
  },
);

export const dynamic = "force-dynamic";
