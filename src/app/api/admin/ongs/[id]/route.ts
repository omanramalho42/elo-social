import { exigirAdmin } from "@/lib/auth";
import { ApiError, lerJson, ok, rota } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { confirmarExclusaoSchema, idSchema, moderacaoSchema } from "@/lib/validators";

// Aprovar/publicar (informando a posição no mapa e a situação dos dados) ou rejeitar (com motivo).
export const PATCH = rota(async (req, { params }: { params: { id: string } }) => {
  const { supabase } = await exigirAdmin();
  const id = idSchema.safeParse(params.id);
  if (!id.success) throw new ApiError(404, "ONG não encontrada.");
  const dados = moderacaoSchema.parse(await lerJson(req));

  const mudanca =
    dados.acao === "aprovar"
      ? { status: "aprovada" as const, lat: dados.lat, lon: dados.lon, verificacao: dados.verificacao, motivo_rejeicao: null }
      : { status: "rejeitada" as const, motivo_rejeicao: dados.motivo };

  const { data, error } = await supabase.from("ongs").update(mudanca).eq("id", id.data).select("id, status").maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "ONG não encontrada.");
  return ok(data);
});

// A equipe pode excluir qualquer ONG (DELETE), por exemplo um cadastro falso.
export const DELETE = rota(async (req, { params }: { params: { id: string } }) => {
  const { supabase } = await exigirAdmin();
  const id = idSchema.safeParse(params.id);
  if (!id.success) throw new ApiError(404, "ONG não encontrada.");
  confirmarExclusaoSchema.parse(await lerJson(req));

  const { data, error } = await supabase.from("ongs").delete().eq("id", id.data).select("id, owner_id");
  if (error) throw error;
  if (!data?.length) throw new ApiError(404, "ONG não encontrada.");

  if (data[0].owner_id) await supabaseAdmin().auth.admin.deleteUser(data[0].owner_id);
  return ok({ mensagem: "ONG excluída." });
});

export const dynamic = "force-dynamic";
