import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, message: string, public detalhes?: unknown) {
    super(message);
  }
}

export const ok = (dados: unknown, status = 200) => NextResponse.json(dados, { status });

export function ipDe(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "desconhecido";
}

/** Proteção CSRF: pedidos que alteram dados só valem se vierem do próprio site. */
export function exigirMesmaOrigem(req: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origem = req.headers.get("origin");
  const permitida = process.env.SITE_URL;
  if (!origem || !permitida || new URL(origem).origin !== new URL(permitida).origin) {
    throw new ApiError(403, "Origem não permitida.");
  }
}

export async function lerJson(req: Request): Promise<unknown> {
  const tipo = req.headers.get("content-type") ?? "";
  if (!tipo.includes("application/json")) throw new ApiError(415, "Envie JSON.");
  const texto = await req.text();
  if (texto.length > 20_000) throw new ApiError(413, "Corpo grande demais.");
  try {
    return JSON.parse(texto);
  } catch {
    throw new ApiError(400, "JSON inválido.");
  }
}

/** Envolve cada rota: trata erros sem vazar detalhes internos. */
export function rota<C>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    try {
      exigirMesmaOrigem(req);
      return await fn(req, ctx);
    } catch (e) {
      if (typeof e === "object" && e !== null && "digest" in e) throw e; // erros internos do Next (ex.: render dinâmico)
      if (e instanceof ApiError) return NextResponse.json({ erro: e.message, detalhes: e.detalhes }, { status: e.status });
      if (e instanceof ZodError) {
        return NextResponse.json(
          { erro: "Dados inválidos.", detalhes: e.issues.map((i) => ({ campo: i.path.join("."), mensagem: i.message })) },
          { status: 422 },
        );
      }
      console.error("Erro interno:", e instanceof Error ? e.message : "desconhecido");
      return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
    }
  };
}
