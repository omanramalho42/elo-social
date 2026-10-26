import { exigirUsuario } from "@/lib/auth";
import { ok, rota } from "@/lib/http";

export const GET = rota(async () => {
  const { supabase, user } = await exigirUsuario();
  const { data: perfil } = await supabase.from("perfis").select("papel, nome, telefone").eq("user_id", user.id).maybeSingle();
  const { data: ong } = await supabase.from("ongs").select("id").eq("owner_id", user.id).maybeSingle();
  return ok({
    email: user.email,
    nome: perfil?.nome ?? null,
    telefone: perfil?.telefone ?? null,
    papel: perfil?.papel ?? "ong",
    ongVinculadaId: ong?.id ?? null,
  });
});

export const dynamic = "force-dynamic";
