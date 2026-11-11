import { exigirUsuario } from "@/biblioteca/autenticacao";
import { ok, rota } from "@/biblioteca/http";

export const GET = rota(async () => {
  const { supabase, user: usuario } = await exigirUsuario();
  const { data: perfil, error: erroPerfil } = await supabase
    .from("perfis")
    .select("papel, nome, telefone")
    .eq("user_id", usuario.id)
    .maybeSingle();
  if (erroPerfil) throw erroPerfil;
  const { data: ong, error: erroOng } = await supabase
    .from("ongs")
    .select("id")
    .eq("owner_id", usuario.id)
    .maybeSingle();
  if (erroOng) throw erroOng;
  return ok({
    email: usuario.email,
    nome: perfil?.nome ?? null,
    telefone: perfil?.telefone ?? null,
    papel: perfil?.papel ?? "ong",
    ongVinculadaId: ong?.id ?? null,
  });
});

export const dynamic = "force-dynamic";
