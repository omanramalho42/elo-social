import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { enderecosAplicacao } from "./enderecos";

export class ErroApi extends Error {
  constructor(
    public status: number,
    mensagem: string,
    public detalhes?: unknown,
  ) {
    super(mensagem);
  }
}

export const ok = (dados: unknown, situacao = 200) =>
  NextResponse.json(dados, { status: situacao });

/** Proteção CSRF: pedidos que alteram dados só valem se vierem do próprio site. */
export function exigirMesmaOrigem(requisicao: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(requisicao.method)) return;
  const origem = requisicao.headers.get("origin");
  let origemRecebida: string;
  try {
    origemRecebida = new URL(origem ?? "").origin;
  } catch {
    throw new ErroApi(403, "Origem não permitida.");
  }
  const enderecos = enderecosAplicacao();
  const permitidas = [enderecos.backend, enderecos.frontend]
    .map((valor) => new URL(valor).origin);
  if (!permitidas.includes(origemRecebida)) {
    throw new ErroApi(403, "Origem não permitida.");
  }
}

export async function lerJson(requisicao: Request): Promise<unknown> {
  const tipo = requisicao.headers.get("content-type") ?? "";
  if (!tipo.includes("application/json")) throw new ErroApi(415, "Envie JSON.");
  const texto = await requisicao.text();
  if (texto.length > 20_000) throw new ErroApi(413, "Corpo grande demais.");
  try {
    return JSON.parse(texto);
  } catch {
    throw new ErroApi(400, "JSON inválido.");
  }
}

/** Envolve cada rota: trata erros sem vazar detalhes internos. */
export function rota<C>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (requisicao: Request, contexto: C) => {
    try {
      exigirMesmaOrigem(requisicao);
      return await fn(requisicao, contexto);
    } catch (e) {
      if (typeof e === "object" && e !== null && "digest" in e) throw e; // erros internos do Next (ex.: render dinâmico)
      if (e instanceof ErroApi)
        return NextResponse.json(
          { erro: e.message, detalhes: e.detalhes },
          { status: e.status },
        );
      if (e instanceof ZodError) {
        return NextResponse.json(
          {
            erro: "Dados inválidos.",
            detalhes: e.issues.map((i) => ({
              campo: i.path.join("."),
              mensagem: i.message,
            })),
          },
          { status: 422 },
        );
      }
      console.error(
        "Erro interno:",
        e instanceof Error ? e.message : "desconhecido",
      );
      return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
    }
  };
}
