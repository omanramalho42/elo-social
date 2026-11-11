import assert from "node:assert/strict";
import { test } from "node:test";
import { configuracaoSupabase } from "../biblioteca/configuracao";
import { ErroApi } from "../biblioteca/http";

test("configuração ausente retorna indisponibilidade sem vazar valores", () => {
  for (const ambiente of [
    {},
    { NEXT_PUBLIC_SUPABASE_URL: "https://SEU-PROJETO.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "chave-anon-publica", SUPABASE_SERVICE_ROLE_KEY: "chave-service-role-secreta" },
    { NEXT_PUBLIC_SUPABASE_URL: "invalida", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-ficticia", SUPABASE_SERVICE_ROLE_KEY: "segredo-ficticio" },
  ]) {
    assert.throws(() => configuracaoSupabase(ambiente), (erro) =>
      erro instanceof ErroApi && erro.status === 503 && !erro.message.includes("ficticio"));
  }
});
