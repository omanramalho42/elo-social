import assert from "node:assert/strict";
import { test } from "node:test";
import { ErroApi, exigirMesmaOrigem } from "../biblioteca/http";

test("requisições aceitam as origens do frontend e do backend", () => {
  const siteAnterior = process.env.SITE_URL;
  const interfaceAnterior = process.env.FRONTEND_URL;
  process.env.SITE_URL = "https://elo-social-6qwo.vercel.app";
  process.env.FRONTEND_URL = "https://elo-social-chi.vercel.app";
  const pedido = (origem: string) =>
    new Request("https://elo-social-6qwo.vercel.app/api/cadastro", {
      method: "POST",
      headers: { origin: origem },
    });

  try {
    assert.doesNotThrow(() =>
      exigirMesmaOrigem(pedido("https://elo-social-6qwo.vercel.app")),
    );
    assert.doesNotThrow(() =>
      exigirMesmaOrigem(pedido("https://elo-social-chi.vercel.app")),
    );
    for (const origem of ["https://outro-site.example", "origem-invalida"])
      assert.throws(
        () => exigirMesmaOrigem(pedido(origem)),
        (erro) => erro instanceof ErroApi && erro.status === 403,
      );
  } finally {
    if (siteAnterior === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = siteAnterior;
    if (interfaceAnterior === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = interfaceAnterior;
  }
});
