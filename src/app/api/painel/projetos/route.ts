import { exigirUsuario } from "@/lib/auth";
import { ApiError, lerJson, ok, rota } from "@/lib/http";
import { projetoSchema } from "@/lib/validators";

// Lista os projetos da ONG do gestor logado (Read).
export const GET = rota(async () => {
  const { supabase, user } = await exigirUsuario();
  const { data: ong } = await supabase.from("ongs").select("id").eq("owner_id", user.id).maybeSingle();
  if (!ong) throw new ApiError(404, "Nenhuma ONG vinculada a esta conta.");

  const { data, error } = await supabase.from("projetos").select("id, nome, descricao").eq("ong_id", ong.id).order("id");
  if (error) throw error;
  return ok(data);
});

export const POST = rota(async (req) => {
  const { supabase, user } = await exigirUsuario();
  const { nome, descricao } = projetoSchema.parse(await lerJson(req));

  const { data: ong } = await supabase.from("ongs").select("id").eq("owner_id", user.id).maybeSingle();
  if (!ong) throw new ApiError(404, "Nenhuma ONG vinculada a esta conta.");

  const { data, error } = await supabase.from("projetos").insert({ ong_id: ong.id, nome, descricao: descricao ?? null }).select("id, nome, descricao").single();
  if (error) {
    if (error.message.includes("Limite")) throw new ApiError(422, "Limite de 30 projetos atingido.");
    throw error;
  }
  return ok(data, 201);
});

export const dynamic = "force-dynamic";
