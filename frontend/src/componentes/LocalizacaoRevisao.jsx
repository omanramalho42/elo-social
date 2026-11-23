import { useEffect, useId, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";
import { validarLocalizacao } from "../utilitarios/localizacao";
import { api } from "../api";

function Seletor({ localizacao, selecionar }) {
  const mapa = useMapEvents({ click: ({ latlng }) => selecionar(latlng.lat.toFixed(6), latlng.lng.toFixed(6)) });
  useEffect(() => {
    if (localizacao.valida) mapa.panTo([localizacao.lat, localizacao.lon], { animate: false });
  }, [localizacao.lat, localizacao.lon, localizacao.valida, mapa]);
  return localizacao.valida ? <CircleMarker center={[localizacao.lat, localizacao.lon]} radius={9} pathOptions={{ color: "#1c251f", fillColor: "#d7e4c7", fillOpacity: 1 }} /> : null;
}

export default function LocalizacaoRevisao({ ongId, lat, lon, alterar, endereco, ocupado }) {
  const [aberto, definirAberto] = useState(false);
  const [buscando, definirBuscando] = useState(false);
  const [resultadoBusca, definirResultadoBusca] = useState("");
  const [tentativa, definirTentativa] = useState(0);
  const modificado = useRef(false);
  const atuais = useRef({ lat, lon, alterar });
  atuais.current = { lat, lon, alterar };
  useEffect(() => {
    if (!endereco || atuais.current.lat !== "" || atuais.current.lon !== "") return;
    const controlador = new AbortController();
    let ativo = true;
    const limite = setTimeout(() => controlador.abort(), 65000);
    definirBuscando(true);
    definirResultadoBusca("");
    api(`/admin/ongs/${ongId}/localizacao`, { signal: controlador.signal })
      .then((dados) => {
        if (!ativo || modificado.current) return;
        if (dados.situacao === "encontrada" && validarLocalizacao(dados.lat, dados.lon).valida) {
          atuais.current.alterar(String(dados.lat), String(dados.lon));
          definirAberto(true);
          definirResultadoBusca(dados.precisao === "numero"
            ? `Coordenadas preenchidas pelo endereço: ${dados.enderecoEncontrado}. Confira o ponto antes de aprovar.`
            : `Via encontrada: ${dados.enderecoEncontrado}. Coordenadas aproximadas preenchidas; confira a altura do número no mapa antes de aprovar.`);
        } else definirResultadoBusca(dados.mensagem || "Endereço não localizado. Confira o cadastro e ajuste o ponto no mapa.");
      })
      .catch(() => { if (ativo) definirResultadoBusca("A busca automática não respondeu. Tente novamente ou selecione o ponto no mapa."); })
      .finally(() => { clearTimeout(limite); if (ativo) definirBuscando(false); });
    return () => { ativo = false; clearTimeout(limite); controlador.abort(); };
  }, [ongId, endereco, tentativa]);
  function alterarManualmente(a, b) {
    modificado.current = true;
    definirResultadoBusca("");
    alterar(a, b);
  }
  const id = useId();
  const localizacao = validarLocalizacao(lat, lon);
  return <section className="localizacao-revisao" aria-label="Localização para publicação">
    <p><strong>1. Confira a localização da ONG</strong><br />{endereco || "Endereço não informado. Confira a localização com a instituição."}</p>
    {buscando && <p className="dica" role="status">Buscando coordenadas pelo endereço cadastrado… Você pode ajustar o ponto enquanto aguarda.</p>}
    {resultadoBusca && <p className="dica" role="status">{resultadoBusca}</p>}
    {!buscando && resultadoBusca && lat === "" && lon === "" && <button type="button" className="botao" onClick={() => { modificado.current = false; definirTentativa((n) => n + 1); }} disabled={ocupado}>Tentar buscar pelo endereço novamente</button>}
    <button type="button" className="botao" aria-expanded={aberto} aria-controls={`${id}-mapa`} onClick={() => definirAberto(!aberto)} disabled={ocupado}>{aberto ? "Fechar mapa" : "Selecionar localização no mapa"}</button>
    {aberto && <div id={`${id}-mapa`}>
      <p className="dica">{localizacao.valida ? "Confira a posição sugerida. Para ajustar, amplie o mapa e clique no ponto da ONG." : "Amplie até encontrar o endereço e clique no ponto da ONG. O centro inicial é apenas uma referência de Fortaleza."} Você também pode editar as coordenadas abaixo.</p>
      <MapContainer className="mapa-revisao" center={localizacao.valida ? [localizacao.lat, localizacao.lon] : [-3.77, -38.55]} zoom={localizacao.valida ? 15 : 12} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Seletor localizacao={localizacao} selecionar={(a, b) => { if (!ocupado) alterarManualmente(a, b); }} />
      </MapContainer>
    </div>}
    <div className="coordenadas-administracao">
      <label className="campo">Latitude *<input type="text" inputMode="decimal" value={lat} disabled={ocupado} onChange={(e) => alterarManualmente(e.target.value, lon)} aria-describedby={`${id}-ajuda`} /></label>
      <label className="campo">Longitude *<input type="text" inputMode="decimal" value={lon} disabled={ocupado} onChange={(e) => alterarManualmente(lat, e.target.value)} aria-describedby={`${id}-ajuda`} /></label>
    </div>
    <p id={`${id}-ajuda`} className="dica" role="status">{localizacao.mensagem}</p>
    {(buscando || resultadoBusca) && <p className="dica">Busca: <a href="https://photon.komoot.io/" target="_blank" rel="noreferrer">Photon</a> · dados © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>.</p>}
  </section>;
}
