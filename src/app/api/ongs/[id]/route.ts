import { ApiError, ok, rota } from "@/lib/http";
import { supabaseDoUsuario } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validators";

// Perfil público: sobre a instituição + projetos.
export const GET = rota(async (_req, { params }: { params: { id: string } }) => {
  const id = idSchema.safeParse(params.id);
  if (!id.success) throw new ApiError(404, "ONG não encontrada.");

  const { data, error } = await supabaseDoUsuario()
    .from("ongs")
    .select("id, nome, bairro, area, descricao, endereco, contato, cnpj, site, lat, lon, verificacao, projetos(id, nome, descricao)")
    .eq("id", id.data)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "ONG não encontrada.");
  return ok(data);
});

export const dynamic = "force-dynamic";
