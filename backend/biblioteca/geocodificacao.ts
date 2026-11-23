import { setTimeout as aguardar } from "node:timers/promises";
import { ErroApi } from "./http";

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
type Localizacao = { lat: number; lon: number; enderecoEncontrado: string; precisao: "numero" | "via"; fonte: string };

export function selecionarLocalizacao(resposta: unknown, endereco: string): Localizacao | null {
  const features = (resposta as { features?: unknown[] })?.features;
  if (!Array.isArray(features)) return null;
  for (const feature of features) {
    const f = feature as { geometry?: { type?: string; coordinates?: unknown[] }; properties?: Record<string, unknown> };
    const p = f?.properties || {};
    const [lon, lat] = f?.geometry?.coordinates || [];
    if (f?.geometry?.type !== "Point" || typeof lat !== "number" || typeof lon !== "number" || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -4.1 || lat > -3.6 || lon < -38.8 || lon > -38.3) continue;
    if (typeof p.city !== "string" || normalizar(p.city) !== "fortaleza") continue;
    const via = typeof p.street === "string" ? p.street : p.osm_key === "highway" && typeof p.name === "string" ? p.name : "";
    const nomeVia = normalizar(via).replace(/^(rua|avenida|av|travessa|alameda|estrada) /, "");
    if (nomeVia.length < 4 || !normalizar(endereco).includes(nomeVia)) continue;
    const numero = typeof p.housenumber === "string" && normalizar(endereco).split(" ").includes(normalizar(p.housenumber)) ? p.housenumber : "";
    return { lat, lon, enderecoEncontrado: [via, numero, typeof p.district === "string" ? p.district : "", "Fortaleza"].filter(Boolean).join(", "), precisao: numero ? "numero" : "via", fonte: "Photon / OpenStreetMap" };
  }
  return null;
}

// Uma fila por processo, cache limitado e deduplicação evitam consultas repetidas.
// A URL pode apontar a outra instância Photon sem alterar o código.
export function criarGeocodificador(consultar: typeof fetch = fetch) {
  const cache = new Map<string, { ate: number; resultado: Localizacao | null }>();
  const pendentes = new Map<string, Promise<Localizacao | null>>();
  let fila: Promise<unknown> = Promise.resolve();
  let proximaConsulta = 0;
  return async function buscar(endereco: string, bairro: string) {
    if (!endereco.trim()) return null;
    const consulta = `${endereco.replace(/\bcep\s*:?\s*\d{5}-?\d{3}/gi, "")}, ${bairro}, Fortaleza, Brasil`;
    const chave = normalizar(consulta);
    const salvo = cache.get(chave);
    if (salvo && salvo.ate > Date.now()) return salvo.resultado;
    const existente = pendentes.get(chave);
    if (existente) return existente;
    if (pendentes.size >= 8) throw new ErroApi(503, "A busca de endereços está ocupada. Tente novamente ou ajuste a posição no mapa.");
    const tarefa = fila.then(async () => {
      await aguardar(Math.max(0, proximaConsulta - Date.now()));
      proximaConsulta = Date.now() + 1100;
      const url = new URL(process.env.GEOCODIFICACAO_URL || "https://photon.komoot.io/api/");
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error();
      url.search = new URLSearchParams({ q: consulta, limit: "5", bbox: "-38.8,-4.1,-38.3,-3.6" }).toString();
      const resposta = await consultar(url, { headers: { "User-Agent": "EloSocial/1.0 (https://elo-social-web-jpbraga.vercel.app)" }, signal: AbortSignal.timeout(8000), cache: "no-store" });
      if (!resposta.ok) { await resposta.body?.cancel(); throw new Error(); }
      const resultado = selecionarLocalizacao(await resposta.json(), endereco);
      if (cache.size >= 250) cache.delete(cache.keys().next().value!);
      cache.set(chave, { ate: Date.now() + 86400000, resultado });
      return resultado;
    });
    fila = tarefa.catch(() => undefined);
    pendentes.set(chave, tarefa);
    try { return await tarefa; }
    catch (e) {
      if (e instanceof ErroApi) throw e;
      throw new ErroApi(503, "Não foi possível buscar o endereço agora. Tente novamente ou ajuste a posição no mapa.");
    } finally { pendentes.delete(chave); }
  };
}

export const buscarLocalizacao = criarGeocodificador();
