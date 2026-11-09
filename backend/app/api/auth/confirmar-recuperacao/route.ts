import { confirmarEndereco } from "@/biblioteca/autenticacao";
import { lerJson, ok, rota } from "@/biblioteca/http";
import { confirmarEnderecoSchema } from "@/biblioteca/validacoes";

// Troca o código de uso único do endereço pela sessão guardada em cookie HttpOnly.
export const POST = rota(async (requisicao) => {
  const dados = confirmarEnderecoSchema.parse(await lerJson(requisicao));
  await confirmarEndereco(
    dados,
    "Endereço inválido ou expirado. Solicite outro no mesmo navegador em que vai abrir o e-mail.",
  );
  return ok({ mensagem: "Endereço confirmado. Defina sua nova senha." });
});

export const dynamic = "force-dynamic";
