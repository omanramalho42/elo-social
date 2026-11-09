import { ErroApi, ok, rota } from "@/biblioteca/http";
import { supabaseDoUsuario } from "@/biblioteca/supabase/servidor";
import { idSchema } from "@/biblioteca/validacoes";

// Perfil público: sobre a instituição + projetos.
export const GET = rota(
  async (_req, { params: parametros }: { params: { id: string } }) => {
    const id = idSchema.safeParse(parametros.id);
    if (!id.success) throw new ErroApi(404, "ONG não encontrada.");

    const { data: dados, error: erro } = await supabaseDoUsuario()
      .from("ongs")
      .select(
        "id, nome, bairro, area, descricao, endereco, contato, cnpj, site, lat, lon, verificacao, projetos(id, nome, descricao)",
      )
      .eq("id", id.data)
      .eq("status", "aprovada")
      .maybeSingle();
    if (erro) throw erro;
    if (!dados) throw new ErroApi(404, "ONG não encontrada.");
    return ok(dados);
  },
);

export const dynamic = "force-dynamic";
