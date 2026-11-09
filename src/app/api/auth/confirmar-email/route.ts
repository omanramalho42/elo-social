import { confirmarEndereco } from "@/biblioteca/autenticacao";
import { lerJson, ok, rota } from "@/biblioteca/http";
import { confirmarEnderecoSchema } from "@/biblioteca/validacoes";

// O código de confirmação é trocado por uma sessão no mesmo navegador do cadastro.
export const POST = rota(async (requisicao) => {
  const dados = confirmarEnderecoSchema.parse(await lerJson(requisicao));
  await confirmarEndereco(
    dados,
    "Endereço inválido ou expirado. Abra o e-mail no navegador usado no cadastro.",
  );
  return ok({ mensagem: "E-mail confirmado." });
});

export const dynamic = "force-dynamic";
