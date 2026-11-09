import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (process.env.ELOSOCIAL_PREPARAR_APRESENTACAO !== "1")
  throw new Error("Defina ELOSOCIAL_PREPARAR_APRESENTACAO=1 para preparar os dados.");

const configuracao = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .map((linha) => linha.match(/^([A-Z_]+)=(.*)$/))
    .filter(Boolean)
    .map((partes) => [partes[1], partes[2].replace(/^['"]|['"]$/g, "")]),
);
const banco = createClient(
  configuracao.NEXT_PUBLIC_SUPABASE_URL,
  configuracao.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const origem = "http://localhost:3000";
const sessao = new Map();

const associacoes = [
  {
    nome: "Associação Peter Pan",
    cnpj: "02.943.482/0001-49",
    descricao:
      "Associação de combate ao câncer infantojuvenil que oferece acolhimento e programas de promoção à saúde para crianças e adolescentes em tratamento e suas famílias.",
    area: "Saúde",
    bairro: "Vila União",
    endereco: "Rua Alberto Montezuma, 350, Vila União, Fortaleza - CE",
    responsavel: "Equipe EloSocial (levantamento em fontes públicas)",
    contato: "(85) 99994-8171",
    site: "https://www.app.org.br/",
    referencias:
      "Fontes: https://www.app.org.br/quem-somos/ ; https://www.app.org.br/projetos/ ; https://www.app.org.br/contato-geral/ ; CNPJ e endereço em https://app.org.br/wp-content/uploads/2021/11/Relatorio-de-atividades-2020.pdf . Sem vínculo institucional. Marcador obtido por busca do endereço no OpenStreetMap/Nominatim; confirme no local.",
    lat: -3.7657177,
    lon: -38.5330657,
    projetos: [
      {
        nome: "Aperfeiçoamento de Dados do Registro Hospitalar do Câncer",
        descricao:
          "Projeto da Associação Peter Pan para melhorar indicadores e relatórios sobre o tratamento no Centro Pediátrico do Câncer. Fonte: https://www.app.org.br/projetos/",
      },
      {
        nome: "Revitalização da Recepção do Hospital Peter Pan",
        descricao:
          "Reestruturação da recepção para acolher melhor pacientes e famílias. Fonte: https://www.app.org.br/projetos/",
      },
    ],
  },
  {
    nome: "Associação Projeto Frente Beneficente para a Criança",
    cnpj: "11.333.200/0001-82",
    descricao:
      "Entidade filantrópica de Fortaleza que atende crianças, adolescentes, jovens e famílias em situação de vulnerabilidade por meio de ações de educação, saúde e promoção social.",
    area: "Assistência social",
    bairro: "Alto da Balança",
    endereco: "Rua Capitão Uruguai, 393, Alto da Balança, Fortaleza - CE",
    responsavel: "Equipe EloSocial (levantamento em fontes públicas)",
    contato: "projetofbpc1458@hotmail.com",
    site: "https://www.frentebeneficente.org.br/",
    referencias:
      "Fontes oficiais: https://www.frentebeneficente.org.br/quem-somos ; https://www.frentebeneficente.org.br/programas-e-projetos ; https://www.frentebeneficente.org.br/contatos . Sem vínculo institucional. Marcador obtido por busca do endereço no OpenStreetMap/Nominatim; confirme no local.",
    lat: -3.7665153,
    lon: -38.5142417,
    projetos: [
      {
        nome: "Programa Crescendo com Você",
        descricao:
          "Apoia o desenvolvimento de crianças de 0 a 5 anos e oferece atividades com familiares e cuidadores. Fonte: https://www.frentebeneficente.org.br/programas-e-projetos",
      },
      {
        nome: "Programa PACTO",
        descricao:
          "Participação cívica, transformação e oportunidades para jovens de 15 a 24 anos. Fonte: https://www.frentebeneficente.org.br/programas-e-projetos",
      },
    ],
  },
];

// Nomes e identificadores conferidos no banco antes da limpeza. Não apaga
// registros com o mesmo nome que tenham outro identificador ou outro gestor.
const exemplosAntigos = new Map([
  [1, "Instituto Maré Viva"],
  [3, "Casa do Cuidado"],
  [4, "Associação Demonstração"],
  [5, "Rede Aprender"],
  [7, "Instituição Ensino"],
  [31, "Associação Exemplo Fictício"],
]);

async function requisitar(caminho, { metodo = "GET", corpo, usarSessao = false } = {}) {
  const cabecalhos = { Origin: origem };
  if (corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
  if (usarSessao && sessao.size)
    cabecalhos.Cookie = [...sessao]
      .map(([chave, valor]) => `${chave}=${valor}`)
      .join("; ");
  const resposta = await fetch(`${origem}${caminho}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  if (usarSessao)
    for (const item of resposta.headers.getSetCookie()) {
      const [par] = item.split(";");
      const separador = par.indexOf("=");
      if (separador > 0) sessao.set(par.slice(0, separador), par.slice(separador + 1));
    }
  const dados = await resposta.json().catch(() => ({}));
  return { codigo: resposta.status, dados };
}

function exigir(resposta, codigo, etapa) {
  assert.equal(
    resposta.codigo,
    codigo,
    `${etapa}: HTTP ${resposta.codigo}: ${resposta.dados.erro || "sem mensagem"}`,
  );
  console.log(`OK: ${etapa}`);
  return resposta.dados;
}

const { data: registrosAntigos, error: erroInventario } = await banco
  .from("ongs")
  .select("id,nome,owner_id")
  .in("id", [...exemplosAntigos.keys()]);
if (erroInventario) throw erroInventario;
const exemplosParaRemover = registrosAntigos.filter(
  (ong) => ong.nome === exemplosAntigos.get(ong.id),
);
for (const ong of exemplosParaRemover) {
  if (ong.owner_id) {
    assert.equal(ong.id, 5, `Registro ${ong.id} tem gestor inesperado`);
    const { data: perfil, error: erroPerfil } = await banco
      .from("perfis")
      .select("email")
      .eq("user_id", ong.owner_id)
      .single();
    if (erroPerfil) throw erroPerfil;
    assert.equal(perfil.email, "gestor@demo.org");
  }
}

exigir(await requisitar("/api/admin/ongs"), 401, "admin exige sessão");
const entrada = exigir(
  await requisitar("/api/auth/login", {
    metodo: "POST",
    corpo: { email: "admin@demo.org", senha: "Demo12345" },
    usarSessao: true,
  }),
  200,
  "entrada do administrador",
);
assert.ok(entrada.mensagem);

const situacoesFinais = new Map();
for (const associacao of associacoes) {
  const numeroCnpj = associacao.cnpj.replace(/\D/g, "");
  const { data: existente, error: erroBusca } = await banco
    .from("ongs")
    .select("id,nome,status,owner_id,lat,lon")
    .eq("cnpj", numeroCnpj)
    .maybeSingle();
  if (erroBusca) throw erroBusca;
  let id = existente?.id;
  if (existente) {
    assert.equal(existente.nome, associacao.nome);
  }
  if (!id) {
    // Preparação da equipe: cadastros públicos agora exigem conta de gestor.
    const { projetos, lat, lon, responsavel, referencias, ...pedido } = associacao;
    const { data: criado, error: erroCriacao } = await banco
      .from("ongs")
      .insert({ ...pedido, cnpj: numeroCnpj })
      .select("id")
      .single();
    if (erroCriacao || !criado) throw erroCriacao ?? new Error("ONG não criada.");
    id = criado.id;
    const { error: erroPrivado } = await banco
      .from("ongs_privado")
      .insert({ ong_id: id, responsavel, referencias });
    if (erroPrivado) {
      await banco.from("ongs").delete().eq("id", id);
      throw erroPrivado;
    }
    const pendente = exigir(
      await requisitar(`/api/ongs/${id}`),
      404,
      "perfil pendente fora do catálogo",
    );
    assert.ok(pendente.erro);
  }
  if (!existente || (existente.status === "pendente" && (existente.lat == null || existente.lon == null))) {
    const { data: pendente, error: erroPreparacao } = await banco
      .from("ongs")
      .update({
        lat: associacao.lat,
        lon: associacao.lon,
        verificacao: "nao_verificado",
      })
      .eq("id", id)
      .eq("status", "pendente")
      .select("id,status")
      .single();
    if (erroPreparacao) throw erroPreparacao;
    assert.equal(pendente.status, "pendente");
  }
  const situacaoFinal = existente?.status ?? "pendente";
  situacoesFinais.set(associacao.nome, situacaoFinal);
  for (const projeto of associacao.projetos) {
    const { data: anterior, error: erroProjeto } = await banco
      .from("projetos")
      .select("id")
      .eq("ong_id", id)
      .eq("nome", projeto.nome)
      .maybeSingle();
    if (erroProjeto) throw erroProjeto;
    if (!anterior) {
      const { error: erroInsercao } = await banco
        .from("projetos")
        .insert({ ong_id: id, ...projeto });
      if (erroInsercao) throw erroInsercao;
    }
  }
  exigir(
    await requisitar(`/api/ongs/${id}`),
    situacaoFinal === "aprovada" ? 200 : 404,
    situacaoFinal === "aprovada" ? "perfil já publicado" : "perfil não publicado",
  );
  console.log(`${associacao.nome}: pedido #${id}, situação ${situacaoFinal}`);
}

for (const ong of exemplosParaRemover) {
  const { data: excluido, error: erroExclusao } = await banco
    .from("ongs")
    .delete()
    .eq("id", ong.id)
    .eq("nome", ong.nome)
    .select("id");
  if (erroExclusao) throw erroExclusao;
  assert.equal(excluido.length, 1);
  console.log(`Removido exemplo fictício: ${ong.nome}`);
}

const catalogo = exigir(await requisitar("/api/ongs?limite=100"), 200, "catálogo atualizado");
for (const associacao of associacoes)
  assert.equal(
    catalogo.ongs.some((ong) => ong.nome === associacao.nome),
    situacoesFinais.get(associacao.nome) === "aprovada",
  );
for (const nome of exemplosAntigos.values())
  assert.ok(!catalogo.ongs.some((ong) => ong.nome === nome));
const fila = exigir(
  await requisitar("/api/admin/ongs?status=pendente", { usarSessao: true }),
  200,
  "fila de aprovação",
);
for (const associacao of associacoes) {
  const cartao = fila.find((ong) => ong.nome === associacao.nome);
  if (situacoesFinais.get(associacao.nome) !== "pendente") {
    assert.equal(cartao, undefined);
    continue;
  }
  assert.ok(cartao, `Cartão ausente: ${associacao.nome}`);
  assert.equal(cartao.projetos.length, associacao.projetos.length);
  assert.ok(cartao.lat != null && cartao.lon != null);
}
console.log("Apresentação conferida; decisões já tomadas no painel foram preservadas.");
