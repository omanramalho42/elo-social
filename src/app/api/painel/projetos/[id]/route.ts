import { exigirUsuario } from "@/lib/auth";
import { ApiError, lerJson, ok, rota } from "@/lib/http";
import { idSchema, projetoSchema } from "@/lib/validators";

// O RLS só deixa apagar projetos da própria ONG; de outra ONG simplesmente não encontra nada.
export const DELETE = rota(async (_req, { params }: { params: { id: string } }) => {
  const { supabase } = await exigirUsuario();
  const id = idSchema.safeParse(params.id);
  if (!id.success) throw new ApiError(404, "Projeto não encontrado.");

  const { data, error } = await supabase.from("projetos").delete().eq("id", id.data).select("id");
  if (error) throw error;
  if (!data?.length) throw new ApiError(404, "Projeto não encontrado.");
  return ok({ mensagem: "Projeto removido." });
});

// Editar o nome de um projeto (UPDATE). O RLS só permite nos projetos da própria ONG.
export const PATCH = rota(async (req, { params }: { params: { id: string } }) => {
  const { supabase } = await exigirUsuario();
  const id = idSchema.safeParse(params.id);
  if (!id.success) throw new ApiError(404, "Projeto não encontrado.");
  const dados = projetoSchema.parse(await lerJson(req));

  const { data, error } = await supabase.from("projetos").update(dados).eq("id", id.data).select("id, nome, descricao");
  if (error) throw error;
  if (!data?.length) throw new ApiError(404, "Projeto não encontrado.");
  return ok(data[0]);
});

export const dynamic = "force-dynamic";
