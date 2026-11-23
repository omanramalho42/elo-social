import test from "node:test";
import assert from "node:assert/strict";
import { novoAdministradorSchema, registrarSchema } from "../biblioteca/validacoes";
test("novo administrador exige confirmação explícita, e-mail e não recebe papel do cliente", () => {
  assert.deepEqual(novoAdministradorSchema.parse({ email: " NOVO@EXAMPLE.COM ", confirmar: true }), { email: "novo@example.com", confirmar: true });
  for (const dados of [{ email: "a@example.com" }, { email: "a@example.com", confirmar: false }, { email: "inválido", confirmar: true }, { email: "a@example.com", confirmar: true, papel: "admin" }]) assert.equal(novoAdministradorSchema.safeParse(dados).success, false);
  assert.equal(registrarSchema.safeParse({ nome: "Pessoa Teste", email: "a@example.com", telefone: "85999991234", senha: "SenhaTeste123", confirmarSenha: "SenhaTeste123", papel: "admin" }).success, false);
});
