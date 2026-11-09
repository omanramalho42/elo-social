import { ok, rota } from "@/biblioteca/http";
import { supabaseDoUsuario } from "@/biblioteca/supabase/servidor";
import { AREAS, filtroOngsSchema } from "@/biblioteca/validacoes";

const CAMPOS =
  "id, nome, bairro, area, descricao, site, lat, lon, verificacao, projetos(count)";
const semAcento = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// AJUSTE FACIL PARA A APRESENTACAO:
// true = nomes de A a Z; false = nomes de Z a A.
const ORDEM_CRESCENTE = true;

// Mapa e catálogo (público). O filtro vale também quando a equipe está conectada.
export const GET = rota(async (requisicao) => {
  const parametros = Object.fromEntries(new URL(requisicao.url).searchParams);
  const { q, area, bairro, pagina, limite } = filtroOngsSchema.parse(parametros);

  let consulta = supabaseDoUsuario()
    .from("ongs")
    .select(CAMPOS, { count: "exact" })
    .eq("status", "aprovada")
    .order("nome", { ascending: ORDEM_CRESCENTE });

  if (area) consulta = consulta.eq("area", area);
  if (bairro) consulta = consulta.ilike("bairro", `%${bairro}%`);
  if (q) {
    // Busca por nome, área ou bairro (como na tela). Só letras/números/espaços: evita injeção no filtro.
    const termo = q.replace(/[^\p{L}\p{N} ]/gu, "").trim();
    if (termo) {
      const filtros = [`nome.ilike.%${termo}%`, `bairro.ilike.%${termo}%`];
      for (const a of AREAS)
        if (semAcento(a).includes(semAcento(termo)))
          filtros.push(`area.eq.${a}`);
      consulta = consulta.or(filtros.join(","));
    }
  }

  const de = (pagina - 1) * limite;
  const {
    data: dados,
    error: erro,
    count: total,
  } = await consulta.range(de, de + limite - 1);
  if (erro) throw erro;

  return ok({
    total: total ?? 0,
    pagina,
    ongs: (dados ?? []).map(({ projetos, ...ong }) => ({
      ...ong,
      totalProjetos: projetos?.[0]?.count ?? 0,
    })),
  });
});

export const dynamic = "force-dynamic";
