// Inclusão solicitada pela equipe. Usa somente dados publicados no site do Reviva.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter(line => line && !line.startsWith("#") && line.includes("="))
    .map(line => { const index = line.indexOf("="); return [line.slice(0, index).trim(), line.slice(index + 1).trim()]; })
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const site = "https://projetoreviva.vercel.app/";
const { data: existing, error: lookupError } = await db.from("ongs").select("id").eq("site", site).maybeSingle();
if (lookupError) throw lookupError;
if (existing) {
  console.log("Projeto Reviva já cadastrado. ID:", existing.id);
} else {
  const { data, error } = await db.from("ongs").insert({
    nome: "Projeto Reviva",
    bairro: "Prefeito José Walter",
    area: "Educação",
    descricao: "Iniciativa da Comunidade Cristã Tenda da Aliança que utiliza o Jiu-Jitsu e atividades de formação para crianças e adolescentes em Fortaleza. O site informa aulas às segundas-feiras, às 19h, e aos sábados, às 15h. Consulte o projeto para confirmar horários e participação.",
    endereco: "Rua Vinte Seis, Prefeito José Walter, Fortaleza - CE (número não informado)",
    contato: "Instagram: @projetorevivaoficial",
    site, cnpj: null, owner_id: null,
    // Centro aproximado da Rua 26 no OpenStreetMap; não é a posição confirmada da sede.
    lat: -3.8262552, lon: -38.5551875,
    status: "aprovada", verificacao: "nao_verificado",
  }).select("id").single();
  if (error) throw error;
  const { error: privateError } = await db.from("ongs_privado").insert({
    ong_id: data.id,
    responsavel: "Inclusão solicitada pela equipe do EloSocial com base em fonte pública",
    referencias: "Fonte: https://projetoreviva.vercel.app/ . CNPJ não informado. Coordenadas aproximadas da Rua 26 consultadas no OpenStreetMap/Nominatim, way 158231692; não confirmam a posição da sede. Verificação institucional pendente.",
  });
  if (privateError) throw privateError;
  const { error: projectError } = await db.from("projetos").insert({
    ong_id: data.id, nome: "Aulas de Jiu-Jitsu",
    descricao: "Atividade para crianças e adolescentes de 5 a 15 anos, segundo o site do Projeto Reviva. Inscrições, horários e condições de participação devem ser consultados diretamente no site oficial.",
  });
  if (projectError) throw projectError;
  console.log("Projeto Reviva incluído. ID:", data.id, "— dados públicos, verificação pendente e localização aproximada.");
}
