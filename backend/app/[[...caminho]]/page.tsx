import { notFound, redirect } from "next/navigation";
import { enderecosAplicacao } from "@/biblioteca/enderecos";

type ParametrosBusca = Record<string, string | string[] | undefined>;

// O servidor encaminha páginas abertas na porta da API para a interface.
export default function RedirecionarParaInterface({
  params: parametros,
  searchParams: parametrosBusca,
}: {
  params: { caminho?: string[] };
  searchParams: ParametrosBusca;
}) {
  const caminho = parametros.caminho ?? [];
  if (caminho[0] === "api") notFound();
  const origem = enderecosAplicacao().frontend;

  const destino = new URL(origem);
  const confirmacaoNaRaiz =
    caminho.length === 0 && (parametrosBusca.code || parametrosBusca.error);
  destino.pathname = confirmacaoNaRaiz
    ? "/confirmar-email"
    : `/${caminho.map(encodeURIComponent).join("/")}`;
  for (const [chave, valor] of Object.entries(parametrosBusca)) {
    for (const item of Array.isArray(valor)
      ? valor
      : valor === undefined
        ? []
        : [valor]) {
      destino.searchParams.append(chave, item);
    }
  }
  redirect(destino.toString());
}
