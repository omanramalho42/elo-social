import assert from "node:assert/strict";
import { test } from "node:test";
import { cnpjValido } from "../src/lib/cnpj";
import { cadastroOngSchema, moderacaoSchema, painelSchema, projetoSchema, registrarSchema } from "../src/lib/validators";

const pedido = {
  nome: "Associação Exemplo", cnpj: "11.222.333/0001-81", descricao: "Descrição com mais de vinte caracteres.",
  area: "Saúde", bairro: "Aldeota", endereco: "", responsavel: "Maria Silva", contato: "contato@exemplo.org",
  site: "", referencias: "https://instagram.com/exemplo e CNPJ na Receita",
};

test("CNPJ: aceita válido e rejeita inválido/repetido", () => {
  assert.equal(cnpjValido("11.222.333/0001-81"), true);
  assert.equal(cnpjValido("11.222.333/0001-80"), false);
  assert.equal(cnpjValido("11111111111111"), false);
});

test("cadastro de ONG: campos opcionais vazios são aceitos e o CNPJ é normalizado", () => {
  const r = cadastroOngSchema.parse(pedido);
  assert.equal(r.cnpj, "11222333000181");
  assert.equal(r.endereco, undefined);
  assert.equal(r.site, undefined);
  assert.equal(cadastroOngSchema.safeParse({ ...pedido, cnpj: "" }).success, true); // CNPJ é opcional
});

test("cadastro de ONG: rejeita CNPJ inválido, área inválida, site estranho e campo extra", () => {
  assert.equal(cadastroOngSchema.safeParse({ ...pedido, cnpj: "123" }).success, false);
  assert.equal(cadastroOngSchema.safeParse({ ...pedido, area: "Esporte" }).success, false);
  assert.equal(cadastroOngSchema.safeParse({ ...pedido, site: "javascript:alert(1)" }).success, false);
  assert.equal(cadastroOngSchema.safeParse({ ...pedido, site: "@exemplo" }).success, true);
  assert.equal(cadastroOngSchema.safeParse({ ...pedido, status: "aprovada" }).success, false);
  assert.equal(cadastroOngSchema.safeParse({ ...pedido, responsavel: undefined }).success, false);
});

test("criar conta: senhas precisam conferir e ser fortes; telefone é normalizado", () => {
  const conta = { nome: "Maria Silva", email: "M@Exemplo.org", telefone: "(85) 99999-1234", senha: "senha1234", confirmarSenha: "senha1234" };
  const r = registrarSchema.parse(conta);
  assert.equal(r.email, "m@exemplo.org");
  assert.equal(r.telefone, "85999991234");
  assert.equal(registrarSchema.safeParse({ ...conta, confirmarSenha: "outra1234" }).success, false);
  assert.equal(registrarSchema.safeParse({ ...conta, senha: "curta1", confirmarSenha: "curta1" }).success, false);
});

test("painel: não aceita alterar status, CNPJ, verificação nem posição; campo vazio limpa o opcional", () => {
  const ok = { nome: "Nome novo", bairro: "Centro", area: "Cultura", descricao: "Descrição com mais de vinte caracteres.", contato: "a@b.org", endereco: "", site: "" };
  const r = painelSchema.parse(ok);
  assert.equal(r.endereco, null);
  for (const extra of [{ status: "aprovada" }, { cnpj: "11222333000181" }, { verificacao: "verificado" }, { lat: -3.7 }]) {
    assert.equal(painelSchema.safeParse({ ...ok, ...extra }).success, false);
  }
});

test("projeto: nome obrigatório, descrição opcional", () => {
  assert.equal(projetoSchema.safeParse({ nome: "Biblioteca aberta", descricao: "Rodas de leitura aos sábados." }).success, true);
  assert.equal(projetoSchema.safeParse({ nome: "Biblioteca aberta" }).success, true);
  assert.equal(projetoSchema.safeParse({ descricao: "sem nome" }).success, false);
});

test("moderação: aprovar exige posição em Fortaleza; rejeitar exige motivo", () => {
  assert.equal(moderacaoSchema.safeParse({ acao: "aprovar", lat: -3.73, lon: -38.52 }).success, true);
  assert.equal(moderacaoSchema.safeParse({ acao: "aprovar", lat: 10, lon: 10 }).success, false);
  assert.equal(moderacaoSchema.safeParse({ acao: "rejeitar" }).success, false);
});
