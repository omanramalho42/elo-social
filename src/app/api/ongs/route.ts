import { ok, rota } from "@/lib/http";
import { supabaseDoUsuario } from "@/lib/supabase/server";
import { AREAS, filtroOngsSchema } from "@/lib/validators";

const CAMPOS = "id, nome, bairro, area, descricao, lat, lon, verificacao, projetos(count)";
const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// AJUSTE FACIL PARA A APRESENTACAO:
// true = nomes de A a Z; false = nomes de Z a A.
const ORDEM_CRESCENTE = true;

// Mapa e catálogo (público). O RLS já garante que só ONGs aprovadas aparecem.
export const GET = rota(async (req) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const { q, area, pagina, limite } = filtroOngsSchema.parse(params);

  let consulta = supabaseDoUsuario()
    .from("ongs")
    .select(CAMPOS, { count: "exact" })
    .order("nome", { ascending: ORDEM_CRESCENTE });

  if (area) consulta = consulta.eq("area", area);
  if (q) {
    // Busca por nome, área ou bairro (como na tela). Só letras/números/espaços: evita injeção no filtro.
    const termo = q.replace(/[^\p{L}\p{N} ]/gu, "").trim();
    if (termo) {
      const filtros = [`nome.ilike.%${termo}%`, `bairro.ilike.%${termo}%`];
      for (const a of AREAS) if (semAcento(a).includes(semAcento(termo))) filtros.push(`area.eq.${a}`);
      consulta = consulta.or(filtros.join(","));
    }
  }

  const de = (pagina - 1) * limite;
  const { data, error, count } = await consulta.range(de, de + limite - 1);
  if (error) throw error;

  return ok({
    total: count ?? 0,
    pagina,
    ongs: (data ?? []).map(({ projetos, ...ong }) => ({ ...ong, totalProjetos: projetos?.[0]?.count ?? 0 })),
  });
});

export const dynamic = "force-dynamic";
