import { z } from "zod";
import { exigirAdministrador } from "@/biblioteca/autenticacao";
import { ok, rota } from "@/biblioteca/http";

const filtro = z.object({
  status: z.enum(["pendente", "aprovada", "rejeitada"]).default("pendente"),
});

// Fila de moderação (só equipe). Inclui responsável e referências (privados), visíveis só para a equipe pelo RLS.
export const GET = rota(async (requisicao) => {
  const { supabase } = await exigirAdministrador();
  const { status: situacao } = filtro.parse(
    Object.fromEntries(new URL(requisicao.url).searchParams),
  );
  const { data: dados, error: erro } = await supabase
    .from("ongs")
    .select(
      "id, nome, bairro, area, descricao, endereco, contato, site, cnpj, lat, lon, status, verificacao, owner_id, created_at, ongs_privado(responsavel, referencias), projetos(id, nome, descricao)",
    )
    .eq("status", situacao)
    .order("created_at");
  if (erro) throw erro;
  return ok(dados);
});

export const dynamic = "force-dynamic";
