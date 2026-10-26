import { exigirAdmin } from "@/lib/auth";
import { ApiError, lerJson, ok, rota } from "@/lib/http";
import { gestorSchema, idSchema } from "@/lib/validators";

// Vincula a conta de um gestor (pelo e-mail) a uma ONG. Só a equipe faz isso, depois da conferência.
export const POST = rota(async (req, { params }: { params: { id: string } }) => {
  const { supabase } = await exigirAdmin();
  const id = idSchema.safeParse(params.id);
  if (!id.success) throw new ApiError(404, "ONG não encontrada.");
  const { email } = gestorSchema.parse(await lerJson(req));

  const { data: perfil } = await supabase.from("perfis").select("user_id").eq("email", email).maybeSingle();
  if (!perfil) throw new ApiError(404, "Nenhuma conta com esse e-mail.");

  const { data, error } = await supabase.from("ongs").update({ owner_id: perfil.user_id }).eq("id", id.data).select("id, owner_id");
  if (error?.code === "23505") throw new ApiError(409, "Esse gestor já está vinculado a outra ONG.");
  if (error) throw error;
  if (!data?.length) throw new ApiError(404, "ONG não encontrada.");
  return ok({ mensagem: "Gestor vinculado.", ongId: data[0].id });
});

// Remove o vínculo do gestor com a ONG.
export const DELETE = rota(async (_req, { params }: { params: { id: string } }) => {
  const { supabase } = await exigirAdmin();
  const id = idSchema.safeParse(params.id);
  if (!id.success) throw new ApiError(404, "ONG não encontrada.");
  const { data, error } = await supabase.from("ongs").update({ owner_id: null }).eq("id", id.data).select("id");
  if (error) throw error;
  if (!data?.length) throw new ApiError(404, "ONG não encontrada.");
  return ok({ mensagem: "Vínculo removido." });
});

export const dynamic = "force-dynamic";
