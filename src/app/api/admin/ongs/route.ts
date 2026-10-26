import { z } from "zod";
import { exigirAdmin } from "@/lib/auth";
import { ok, rota } from "@/lib/http";

const filtro = z.object({ status: z.enum(["pendente", "aprovada", "rejeitada"]).default("pendente") });

// Fila de moderação (só equipe). Inclui responsável e referências (privados), visíveis só para a equipe pelo RLS.
export const GET = rota(async (req) => {
  const { supabase } = await exigirAdmin();
  const { status } = filtro.parse(Object.fromEntries(new URL(req.url).searchParams));
  const { data, error } = await supabase
    .from("ongs")
    .select("id, nome, bairro, area, descricao, endereco, contato, site, cnpj, status, verificacao, owner_id, created_at, ongs_privado(responsavel, referencias)")
    .eq("status", status)
    .order("created_at");
  if (error) throw error;
  return ok(data);
});

export const dynamic = "force-dynamic";
