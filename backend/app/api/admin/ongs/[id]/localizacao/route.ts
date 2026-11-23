import { exigirAdministrador } from "@/biblioteca/autenticacao";
import { buscarLocalizacao } from "@/biblioteca/geocodificacao";
import { ErroApi, ok, rota } from "@/biblioteca/http";
import { idSchema } from "@/biblioteca/validacoes";

export const GET = rota(async (_requisicao, { params }: { params: Promise<{ id: string }> }) => {
  const { supabase } = await exigirAdministrador();
  const id = idSchema.safeParse((await params).id);
  if (!id.success) throw new ErroApi(404, "ONG não encontrada.");
  const { data: ong, error } = await supabase.from("ongs").select("endereco, bairro").eq("id", id.data).maybeSingle();
  if (error) throw error;
  if (!ong) throw new ErroApi(404, "ONG não encontrada.");
  const localizacao = ong.endereco ? await buscarLocalizacao(ong.endereco, ong.bairro) : null;
  return ok(localizacao ? { situacao: "encontrada", ...localizacao } : { situacao: "nao_encontrada", mensagem: "O endereço não foi localizado com segurança. Confira o endereço cadastrado e selecione o ponto no mapa." });
});

export const dynamic = "force-dynamic";
