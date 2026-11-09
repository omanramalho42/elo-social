import assert from "node:assert/strict";
import { test } from "node:test";
import {
  celularValido,
  cnpjValido,
  formatarCnpj,
  formatarContato,
  formatarNome,
  formatarTelefone,
  iniciarComMaiuscula,
  urlDoSite,
} from "../src/utilitarios/formatadores.js";

test("CNPJ recebe máscara e continua exigindo dígitos verificadores corretos", () => {
  assert.equal(formatarCnpj("11222333000181"), "11.222.333/0001-81");
  assert.equal(cnpjValido("11.222.333/0001-81"), true);
  assert.equal(cnpjValido("11.222.333/0001-80"), false);
  assert.equal(cnpjValido("112223330001810"), false);
});

test("celular recebe DDD, máscara e 9 dígitos", () => {
  assert.equal(formatarTelefone("85999991234"), "(85) 99999-1234");
  assert.equal(celularValido("(85) 99999-1234"), true);
  assert.equal(celularValido("(85) 9999-1234"), false);
  assert.equal(formatarContato("85999991234"), "(85) 99999-1234");
});

test("nomes, texto, e-mail de contato e domínio são padronizados", () => {
  assert.equal(formatarNome("mARIA da silva"), "Maria da Silva");
  assert.equal(formatarNome("instituto ong do ceará"), "Instituto ONG do Ceará");
  assert.equal(iniciarComMaiuscula("oferecemos oficinas"), "Oferecemos oficinas");
  assert.equal(formatarContato("CONTATO@EXEMPLO.ORG"), "contato@exemplo.org");
  assert.equal(urlDoSite("exemplo.org.br"), "https://exemplo.org.br");
  assert.equal(urlDoSite("  http://exemplo.org.br  "), "https://exemplo.org.br");
  assert.equal(urlDoSite("https://"), "");
});
