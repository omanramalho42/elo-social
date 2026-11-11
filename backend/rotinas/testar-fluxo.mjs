import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { gerarCnpjFicticio } from "../../frontend/src/utilitarios/formatadores.js";

// Ensaio integrado opcional. Cria suas próprias contas e remove apenas seus dados.
// Não envia e-mails: a confirmação usa links gerados administrativamente.
if (process.env.ELOSOCIAL_TESTE_INTEGRACAO !== "1") {
  throw new Error("Defina ELOSOCIAL_TESTE_INTEGRACAO=1 para executar o ensaio.");
}

const configuracao = parseEnv(readFileSync(new URL("../.env.local", import.meta.url), "utf8"));
const base = process.env.ELOSOCIAL_TESTE_URL || "http://localhost:3000";
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname))
  throw new Error("O ensaio só pode chamar uma API local.");
const origem = configuracao.SITE_URL || "http://localhost:3000";
const frontend = configuracao.FRONTEND_URL || "http://127.0.0.1:5173";
const administrador = createClient(
  configuracao.NEXT_PUBLIC_SUPABASE_URL,
  configuracao.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const codigo = randomBytes(5).toString("hex");
let email;
const senha = `Teste${randomBytes(8).toString("hex")}`;
const nome = `ONG Teste Integrado ${codigo}`;
const sessaoAdministrador = new Map();
const sessaoGestor = new Map();
const pedidos = [];
const contasCriadas = [];
let usuarioId;
let verificacoes = 0;

async function criarContaDeTeste(papel, confirmada = true) {
  const endereco = `elo-teste-${papel}-${codigo}-${contasCriadas.length}@example.com`;
  const { data, error } = await administrador.auth.admin.createUser({ email: endereco, password: senha, email_confirm: confirmada });
  if (error || !data.user) throw new Error("Não foi possível criar a conta temporária de teste.");
  contasCriadas.push(data.user.id);
  const { error: erroPerfil } = await administrador.from("perfis").insert({
    user_id: data.user.id, papel, nome: "Conta temporária de teste", email: endereco, telefone: "85999990000",
  });
  if (erroPerfil) throw new Error("Não foi possível criar o perfil temporário de teste.");
  return { id: data.user.id, email: endereco };
}

async function requisitar(caminho, { metodo = "GET", corpo, sessao } = {}) {
  const cabecalhos = { Origin: origem };
  if (corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
  if (sessao?.size)
    cabecalhos.Cookie = [...sessao]
      .map(([chave, valor]) => `${chave}=${valor}`)
      .join("; ");
  const resposta = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
  });
  for (const item of resposta.headers.getSetCookie()) {
    const [par, ...atributos] = item.split(";");
    const separador = par.indexOf("=");
    if (separador < 1 || !sessao) continue;
    const chave = par.slice(0, separador);
    const valor = par.slice(separador + 1);
    if (!valor || atributos.some((a) => /max-age=0/i.test(a)))
      sessao.delete(chave);
    else sessao.set(chave, valor);
  }
  const dados = await resposta.json().catch(() => ({}));
  return { codigo: resposta.status, dados };
}

function conferir(resposta, esperado, etapa) {
  assert.equal(
    resposta.codigo,
    esperado,
    `${etapa}: HTTP ${resposta.codigo}: ${resposta.dados.erro || "sem mensagem"}`,
  );
  console.log(`OK: ${etapa}`);
  verificacoes++;
  return resposta.dados;
}

async function abrirEnderecoGerado(tipo, caminho) {
  const { data: endereco, error: erroEndereco } =
    await administrador.auth.admin.generateLink({
      type: tipo,
      email,
      options: { redirectTo: `${frontend}/${caminho}` },
    });
  if (erroEndereco || !endereco.properties)
    throw erroEndereco ?? new Error("Endereço de teste não gerado.");
  const resposta = await fetch(endereco.properties.action_link, {
    redirect: "manual",
  });
  assert.equal(resposta.status, 303);
  const destino = new URL(resposta.headers.get("location"));
  assert.equal(destino.origin, new URL(frontend).origin);
  assert.equal(destino.pathname, `/${caminho}`);
  const fragmento = new URLSearchParams(destino.hash.slice(1));
  if (destino.searchParams.has("code"))
    return { codigo: destino.searchParams.get("code") };
  assert.ok(fragmento.has("access_token"));
  assert.ok(fragmento.has("refresh_token"));
  return {
    tokenAcesso: fragmento.get("access_token"),
    tokenRenovacao: fragmento.get("refresh_token"),
  };
}

function corpoOng(sufixo, cnpj) {
  return {
    nome: `${nome} ${sufixo}`,
    cnpj,
    descricao: "Cadastro temporário para conferir o fluxo integrado da aplicação.",
    area: "Educação",
    bairro: "Benfica",
    endereco: "Rua de Teste, 100, Fortaleza - CE",
    responsavel: "Equipe de teste",
    contato: email,
    site: "https://example.org",
    referencias: "Registro temporário criado pelo ensaio integrado.",
  };
}

try {
  conferir(
    await requisitar("/api/admin/ongs"),
    401,
    "administração sem sessão bloqueada",
  );
  conferir(
    await requisitar("/api/auth/confirmar-email", {
      metodo: "POST",
      corpo: {
        tokenAcesso: "a".repeat(30),
        tokenRenovacao: "b".repeat(12),
      },
    }),
    400,
    "tokens de confirmação falsos recusados",
  );
  conferir(
    await requisitar("/api/auth/confirmar-recuperacao", {
      metodo: "POST",
      corpo: { codigo: "codigo-invalido" },
    }),
    400,
    "código de recuperação inválido recusado",
  );
  conferir(
    await requisitar("/api/cadastro", { metodo: "POST", corpo: {} }),
    401,
    "cadastro sem sessão bloqueado antes da validação dos dados",
  );
  const cnpjPrimeiro = gerarCnpjFicticio();
  conferir(
    await requisitar("/api/cadastro", {
      metodo: "POST",
      corpo: corpoOng("Aprovação", cnpjPrimeiro),
    }),
    401,
    "pedido completo sem login bloqueado",
  );

  let lista = conferir(
    await requisitar(`/api/ongs?q=${encodeURIComponent(nome)}`),
    200,
    "catálogo antes da aprovação",
  );
  assert.equal(lista.total, 0);

  conferir(await requisitar("/api/saude"), 200, "servidor e banco disponíveis");
  conferir(await requisitar("/api/auth/registrar", { metodo: "POST", corpo: {} }), 422, "cadastro inválido rejeitado sem enviar e-mail");
  const gestorTemporario = await criarContaDeTeste("ong", false);
  usuarioId = gestorTemporario.id;
  email = gestorTemporario.email;
  const adminTemporario = await criarContaDeTeste("admin");

  conferir(
    await requisitar("/api/auth/login", {
      metodo: "POST",
      sessao: sessaoAdministrador,
      corpo: { email: adminTemporario.email, senha },
    }),
    200,
    "entrada da administração",
  );
  const catalogoDaEquipe = conferir(
    await requisitar(`/api/ongs?q=${encodeURIComponent(nome)}`, {
      sessao: sessaoAdministrador,
    }),
    200,
    "catálogo público com administrador conectado",
  );
  assert.equal(catalogoDaEquipe.total, 0);

  const { data: conta } = await administrador.auth.admin.getUserById(usuarioId);
  if (!conta?.user?.email_confirmed_at) {
    conferir(
      await requisitar("/api/auth/confirmar-email", {
        metodo: "POST",
        sessao: sessaoGestor,
        corpo: await abrirEnderecoGerado("magiclink", "confirmar-email"),
      }),
      200,
      "confirmação por endereço do Supabase",
    );
    const confirmada = conferir(
      await requisitar("/api/auth/me", { sessao: sessaoGestor }),
      200,
      "sessão após confirmação",
    );
    assert.equal(confirmada.email, email);
  }

  conferir(
    await requisitar("/api/auth/login", {
      metodo: "POST",
      sessao: sessaoGestor,
      corpo: { email, senha },
    }),
    200,
    "entrada após confirmação",
  );
  const semOng = conferir(
    await requisitar("/api/painel", { sessao: sessaoGestor }),
    200,
    "painel sem ONG vinculada responde sem erro 404",
  );
  assert.equal(semOng.situacao, "sem_ong");

  conferir(
    await requisitar("/api/cadastro", {
      metodo: "POST",
      sessao: sessaoAdministrador,
      corpo: corpoOng("Equipe", gerarCnpjFicticio()),
    }),
    403,
    "administrador não cadastra ONG pela rota de gestor",
  );
  conferir(
    await requisitar("/api/cadastro", {
      metodo: "POST",
      sessao: sessaoGestor,
      corpo: {},
    }),
    422,
    "pedido autenticado sem dados rejeitado",
  );
  const primeiro = conferir(
    await requisitar("/api/cadastro", {
      metodo: "POST",
      sessao: sessaoGestor,
      corpo: corpoOng("Aprovação", cnpjPrimeiro),
    }),
    201,
    "pedido autenticado de ONG",
  );
  pedidos.push(primeiro.protocolo);
  conferir(
    await requisitar("/api/cadastro", {
      metodo: "POST",
      sessao: sessaoGestor,
      corpo: corpoOng("Duplicada", cnpjPrimeiro),
    }),
    409,
    "segunda ONG na mesma conta rejeitada",
  );
  conferir(
    await requisitar(`/api/ongs/${primeiro.protocolo}`, {
      sessao: sessaoAdministrador,
    }),
    404,
    "perfil público pendente oculto também da equipe",
  );
  const fila = conferir(
    await requisitar("/api/admin/ongs?status=pendente", {
      sessao: sessaoAdministrador,
    }),
    200,
    "fila de verificação",
  );
  assert.equal(fila.find((ong) => ong.id === primeiro.protocolo)?.owner_id, usuarioId);
  conferir(
    await requisitar("/api/admin/ongs", { sessao: sessaoGestor }),
    403,
    "gestor não acessa administração",
  );
  const pendente = conferir(
    await requisitar("/api/painel", { sessao: sessaoGestor }),
    200,
    "painel em verificação",
  );
  assert.equal(pendente.status, "pendente");
  conferir(
    await requisitar("/api/painel", {
      metodo: "PATCH",
      sessao: sessaoGestor,
      corpo: {
        nome: pendente.nome,
        bairro: pendente.bairro,
        area: pendente.area,
        descricao: pendente.descricao,
        contato: pendente.contato,
      },
    }),
    403,
    "bloqueio de edição antes da aprovação",
  );

  conferir(
    await requisitar(`/api/admin/ongs/${primeiro.protocolo}`, {
      metodo: "PATCH",
      sessao: sessaoAdministrador,
      corpo: {
        acao: "aprovar",
        lat: -3.73,
        lon: -38.52,
        verificacao: "verificado",
      },
    }),
    200,
    "aprovação da ONG",
  );
  lista = conferir(
    await requisitar(`/api/ongs?bairro=Benfica&q=${encodeURIComponent(codigo)}`),
    200,
    "catálogo após aprovação e filtro de bairro",
  );
  assert.ok(lista.ongs.some((ong) => ong.id === primeiro.protocolo));

  conferir(
    await requisitar("/api/painel", {
      metodo: "PATCH",
      sessao: sessaoGestor,
      corpo: {
        nome: pendente.nome,
        bairro: pendente.bairro,
        area: pendente.area,
        descricao: "Cadastro temporário aprovado e editado pelo gestor de teste.",
        endereco: pendente.endereco,
        contato: pendente.contato,
        site: pendente.site,
      },
    }),
    200,
    "edição pelo gestor aprovado",
  );
  conferir(
    await requisitar("/api/painel", {
      metodo: "PATCH",
      sessao: sessaoGestor,
      corpo: { status: "rejeitada" },
    }),
    422,
    "gestor não altera a situação da ONG",
  );

  const projeto = conferir(
    await requisitar("/api/painel/projetos", {
      metodo: "POST",
      sessao: sessaoGestor,
      corpo: { nome: "Projeto de teste", descricao: "Descrição temporária." },
    }),
    201,
    "criação de projeto",
  );
  conferir(
    await requisitar(`/api/painel/projetos/${projeto.id}`, {
      metodo: "PATCH",
      sessao: sessaoGestor,
      corpo: { nome: "Projeto de teste editado", descricao: "Nova descrição." },
    }),
    200,
    "edição de projeto",
  );
  conferir(
    await requisitar(`/api/painel/projetos/${projeto.id}`, {
      metodo: "DELETE",
      sessao: sessaoGestor,
    }),
    200,
    "remoção de projeto temporário",
  );

  const { responsavel, referencias, ...dadosSegundo } = corpoOng(
    "Recusa",
    gerarCnpjFicticio(),
  );
  const { data: segundo, error: erroSegundo } = await administrador
    .from("ongs")
    .insert({ ...dadosSegundo, cnpj: dadosSegundo.cnpj.replace(/\D/g, "") })
    .select("id")
    .single();
  if (erroSegundo || !segundo)
    throw erroSegundo ?? new Error("Segundo pedido não criado.");
  pedidos.push(segundo.id);
  const { error: erroPrivado } = await administrador
    .from("ongs_privado")
    .insert({ ong_id: segundo.id, responsavel, referencias });
  if (erroPrivado) throw erroPrivado;
  conferir(
    await requisitar(`/api/admin/ongs/${segundo.id}`, {
      metodo: "PATCH",
      sessao: sessaoAdministrador,
      corpo: { acao: "rejeitar", motivo: "Cadastro temporário de teste." },
    }),
    200,
    "recusa da ONG",
  );
  const recusadas = conferir(
    await requisitar("/api/admin/ongs?status=rejeitada", {
      sessao: sessaoAdministrador,
    }),
    200,
    "fila de recusadas",
  );
  assert.ok(recusadas.some((ong) => ong.id === segundo.id));
  lista = conferir(
    await requisitar(`/api/ongs?q=${encodeURIComponent(codigo)}`),
    200,
    "ONG recusada fora do catálogo",
  );
  assert.ok(!lista.ongs.some((ong) => ong.id === segundo.id));
  conferir(
    await requisitar("/api/auth/logout", {
      metodo: "POST",
      sessao: sessaoGestor,
      corpo: {},
    }),
    200,
    "saída do gestor",
  );
  conferir(
    await requisitar("/api/auth/me", { sessao: sessaoGestor }),
    401,
    "sessão encerrada",
  );
  conferir(
    await requisitar("/api/auth/confirmar-recuperacao", {
      metodo: "POST",
      sessao: sessaoGestor,
      corpo: await abrirEnderecoGerado("recovery", "redefinir-senha"),
    }),
    200,
    "endereço de recuperação confirmado",
  );
  conferir(
    await requisitar("/api/auth/me", { sessao: sessaoGestor }),
    200,
    "sessão de recuperação estabelecida",
  );
  const senhaNova = `${senha}Nova`;
  conferir(
    await requisitar("/api/auth/redefinir-senha", {
      metodo: "POST",
      sessao: sessaoGestor,
      corpo: { senha: senhaNova },
    }),
    200,
    "senha de teste alterada",
  );
  conferir(
    await requisitar("/api/auth/me", { sessao: sessaoGestor }),
    401,
    "sessão encerrada após troca de senha",
  );
  conferir(
    await requisitar("/api/auth/login", {
      metodo: "POST",
      sessao: sessaoGestor,
      corpo: { email, senha },
    }),
    401,
    "senha antiga recusada",
  );
  conferir(
    await requisitar("/api/auth/login", {
      metodo: "POST",
      sessao: sessaoGestor,
      corpo: { email, senha: senhaNova },
    }),
    200,
    "entrada com a nova senha",
  );
  conferir(await requisitar("/api/painel", {
    metodo: "DELETE", sessao: sessaoGestor, corpo: { confirmar: false },
  }), 422, "exclusão exige confirmação");
  conferir(await requisitar("/api/painel", {
    metodo: "DELETE", sessao: sessaoGestor, corpo: { confirmar: true },
  }), 200, "exclusão da ONG e conta temporárias pelo gestor");
  conferir(await requisitar(`/api/ongs/${primeiro.protocolo}`), 404, "ONG excluída removida do perfil público");
  conferir(await requisitar("/api/auth/me", { sessao: sessaoGestor }), 401, "conta excluída sem acesso");
  conferir(await requisitar(`/api/admin/ongs/${segundo.id}`, {
    metodo: "DELETE", sessao: sessaoAdministrador, corpo: { confirmar: true },
  }), 200, "exclusão de pedido temporário pela administração");
  console.log(`Fluxo integrado concluído: ${verificacoes} verificações HTTP.`);
} finally {
  const falhas = [];
  for (const id of pedidos) {
    const { error: erroExclusao } = await administrador
      .from("ongs")
      .delete()
      .eq("id", id);
    if (erroExclusao) falhas.push(`pedido ${id}: ${erroExclusao.message}`);
  }
  for (const contaId of contasCriadas) {
    // Pode ter sido removida pela própria API durante o teste de exclusão.
    const { error: erroExclusao } = await administrador.auth.admin.deleteUser(contaId);
    if (erroExclusao && erroExclusao.status !== 404 && erroExclusao.code !== "user_not_found")
      falhas.push("falha ao remover uma conta temporária");
  }
  const { data: restantes, error: erroConsulta } = await administrador
    .from("ongs")
    .select("id")
    .ilike("nome", `${nome}%`);
  if (erroConsulta || restantes?.length)
    falhas.push("ainda há pedidos do ensaio no banco");
  if (falhas.length) throw new Error(`Limpeza incompleta: ${falhas.join("; ")}`);
  console.log("Limpeza dos registros do ensaio conferida.");
}
