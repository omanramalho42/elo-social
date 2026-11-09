import assert from "node:assert/strict";
import { test } from "node:test";
import { cnpjValido } from "../biblioteca/cnpj";
import {
  cadastroOngSchema,
  filtroOngsSchema,
  moderacaoSchema,
  painelSchema,
  projetoSchema,
  registrarSchema,
} from "../biblioteca/validacoes";

const pedido = {
  nome: "Associação Exemplo",
  cnpj: "11.222.333/0001-81",
  descricao: "Descrição com mais de vinte caracteres.",
  area: "Saúde",
  bairro: "Aldeota",
  endereco: "",
  responsavel: "Maria Silva",
  contato: "contato@exemplo.org",
  site: "",
  referencias: "https://instagram.com/exemplo e CNPJ na Receita",
};

test("catálogo: filtra pelo bairro informado e rejeita filtro vazio", () => {
  assert.equal(filtroOngsSchema.parse({ bairro: " Benfica " }).bairro, "Benfica");
  assert.equal(filtroOngsSchema.safeParse({ bairro: " " }).success, false);
});

test("CNPJ: aceita válido e rejeita inválido/repetido", () => {
  assert.equal(cnpjValido("11.222.333/0001-81"), true);
  assert.equal(cnpjValido("11.222.333/0001-80"), false);
  assert.equal(cnpjValido("11111111111111"), false);
});

test("cadastro de ONG: campos opcionais vazios são aceitos, o CNPJ é obrigatório e normalizado", () => {
  const r = cadastroOngSchema.parse(pedido);
  assert.equal(r.cnpj, "11222333000181");
  assert.equal(r.endereco, undefined);
  assert.equal(r.site, undefined);
  assert.equal(
    cadastroOngSchema.safeParse({ ...pedido, cnpj: "" }).success,
    false,
  ); // CNPJ é obrigatório
  const { cnpj: _semCnpj, ...semCnpj } = pedido;
  assert.equal(cadastroOngSchema.safeParse(semCnpj).success, false);
});

test("cadastro de ONG: rejeita CNPJ inválido, área inválida, site estranho e campo extra", () => {
  assert.equal(
    cadastroOngSchema.safeParse({ ...pedido, cnpj: "123" }).success,
    false,
  );
  assert.equal(
    cadastroOngSchema.safeParse({ ...pedido, area: "Esporte" }).success,
    false,
  );
  assert.equal(
    cadastroOngSchema.safeParse({ ...pedido, site: "javascript:alert(1)" })
      .success,
    false,
  );
  assert.equal(
    cadastroOngSchema.safeParse({ ...pedido, site: "@exemplo" }).success,
    true,
  );
  assert.equal(
    cadastroOngSchema.safeParse({ ...pedido, status: "aprovada" }).success,
    false,
  );
  assert.equal(
    cadastroOngSchema.safeParse({ ...pedido, responsavel: undefined }).success,
    false,
  );
});

test("criar conta: senhas precisam conferir e ser fortes; telefone é normalizado", () => {
  const conta = {
    nome: "Maria Silva",
    email: "M@Exemplo.org",
    telefone: "(85) 99999-1234",
    senha: "senha1234",
    confirmarSenha: "senha1234",
  };
  const r = registrarSchema.parse(conta);
  assert.equal(r.email, "m@exemplo.org");
  assert.equal(r.telefone, "85999991234");
  assert.equal(
    registrarSchema.safeParse({ ...conta, telefone: "(85) 9999-1234" }).success,
    false,
  );
  assert.equal(
    registrarSchema.safeParse({ ...conta, telefone: "(85) 89999-1234" }).success,
    false,
  );
  assert.equal(
    registrarSchema.safeParse({ ...conta, confirmarSenha: "outra1234" })
      .success,
    false,
  );
  assert.equal(
    registrarSchema.safeParse({
      ...conta,
      senha: "curta1",
      confirmarSenha: "curta1",
    }).success,
    false,
  );
});

test("contato da ONG: aceita e-mail ou celular com DDD", () => {
  assert.equal(cadastroOngSchema.parse({ ...pedido, contato: "CONTATO@EXEMPLO.ORG" }).contato, "contato@exemplo.org");
  assert.equal(cadastroOngSchema.safeParse({ ...pedido, contato: "(85) 99999-1234" }).success, true);
  assert.equal(cadastroOngSchema.safeParse({ ...pedido, contato: "(85) 9999-1234" }).success, false);
  assert.equal(cadastroOngSchema.safeParse({ ...pedido, contato: "qualquer coisa" }).success, false);
});

test("painel: não aceita alterar situação, CNPJ, verificação nem posição; campo vazio limpa o opcional", () => {
  const ok = {
    nome: "Nome novo",
    bairro: "Centro",
    area: "Cultura",
    descricao: "Descrição com mais de vinte caracteres.",
    contato: "a@b.org",
    endereco: "",
    site: "",
  };
  const r = painelSchema.parse(ok);
  assert.equal(r.endereco, null);
  for (const extra of [
    { status: "aprovada" },
    { cnpj: "11222333000181" },
    { verificacao: "verificado" },
    { lat: -3.7 },
  ]) {
    assert.equal(painelSchema.safeParse({ ...ok, ...extra }).success, false);
  }
});

test("projeto: nome obrigatório, descrição opcional", () => {
  assert.equal(
    projetoSchema.safeParse({
      nome: "Biblioteca aberta",
      descricao: "Rodas de leitura aos sábados.",
    }).success,
    true,
  );
  assert.equal(
    projetoSchema.safeParse({ nome: "Biblioteca aberta" }).success,
    true,
  );
  assert.equal(
    projetoSchema.safeParse({ descricao: "sem nome" }).success,
    false,
  );
});

test("moderação: aprovar exige posição em Fortaleza; rejeitar exige motivo", () => {
  assert.equal(
    moderacaoSchema.safeParse({ acao: "aprovar", lat: -3.73, lon: -38.52 })
      .success,
    true,
  );
  assert.equal(
    moderacaoSchema.safeParse({ acao: "aprovar", lat: 10, lon: 10 }).success,
    false,
  );
  assert.equal(moderacaoSchema.safeParse({ acao: "rejeitar" }).success, false);
});

import { confirmarEnderecoSchema } from "../biblioteca/validacoes";

test("confirmação: aceita código ou sessão e rejeita dados incompletos", () => {
  assert.equal(
    confirmarEnderecoSchema.safeParse({ codigo: "" }).success,
    false,
  );
  assert.equal(
    confirmarEnderecoSchema.safeParse({ codigo: "123" }).success,
    false,
  );
  assert.equal(
    confirmarEnderecoSchema.safeParse({ codigo: "a".repeat(2049) }).success,
    false,
  );
  assert.equal(
    confirmarEnderecoSchema.safeParse({
      codigo: "codigo-de-teste",
      senha: "outra",
    }).success,
    false,
  );
  assert.equal(
    confirmarEnderecoSchema.safeParse({ codigo: "codigo-de-teste" }).success,
    true,
  );
  assert.equal(
    confirmarEnderecoSchema.safeParse({
      tokenAcesso: "a".repeat(30),
      tokenRenovacao: "b".repeat(12),
    }).success,
    true,
  );
  assert.equal(
    confirmarEnderecoSchema.safeParse({ tokenAcesso: "a".repeat(30) }).success,
    false,
  );
});
