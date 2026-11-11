import assert from "node:assert/strict";
import { test } from "node:test";
import { ErroApi, exigirMesmaOrigem } from "../biblioteca/http";
import { enderecosAplicacao } from "../biblioteca/enderecos";

test("produção sem FRONTEND_URL usa o site oficial para origens e links de e-mail", () => {
  const ambienteAnterior = { ...process.env };
  try {
    Object.assign(process.env, { NODE_ENV: "production", SITE_URL: "https://elo-social-6qwo.vercel.app" });
    delete process.env.FRONTEND_URL;
    assert.equal(enderecosAplicacao().frontend, "https://elo-social-chi.vercel.app");
    const pedido = (origem?: string) => new Request("https://elo-social-6qwo.vercel.app/api/auth/recuperar-senha", {
      method: "POST",
      headers: origem === undefined ? {} : { origin: origem },
    });
    assert.doesNotThrow(() => exigirMesmaOrigem(pedido("https://elo-social-chi.vercel.app")));
    for (const origem of [undefined, "null", "https://outro-site.example", "https://elo-social-chi.vercel.app.evil.example", "http://127.0.0.1:5173"]) {
      assert.throws(() => exigirMesmaOrigem(pedido(origem)),
        (erro) => erro instanceof ErroApi && erro.status === 403);
    }
  } finally {
    for (const chave of ["NODE_ENV", "SITE_URL", "FRONTEND_URL"]) {
      if (ambienteAnterior[chave] === undefined) delete process.env[chave];
      else process.env[chave] = ambienteAnterior[chave];
    }
  }
});

test("endereços locais e hospedagem alternativa preservam seus retornos", () => {
  assert.deepEqual(enderecosAplicacao({ NODE_ENV: "development" }), {
    backend: "http://localhost:3000", frontend: "http://127.0.0.1:5173",
  });
  assert.deepEqual(enderecosAplicacao({ NODE_ENV: "production", SITE_URL: "https://api.example.org", FRONTEND_URL: "https://site.example.org" }), {
    backend: "https://api.example.org", frontend: "https://site.example.org",
  });
});

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
