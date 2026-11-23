import { useId, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";
import { validarLocalizacao } from "../utilitarios/localizacao";

function Seletor({ localizacao, selecionar }) {
  useMapEvents({ click: ({ latlng }) => selecionar(latlng.lat.toFixed(6), latlng.lng.toFixed(6)) });
  return localizacao.valida ? <CircleMarker center={[localizacao.lat, localizacao.lon]} radius={9} pathOptions={{ color: "#1c251f", fillColor: "#d7e4c7", fillOpacity: 1 }} /> : null;
}

export default function LocalizacaoRevisao({ lat, lon, alterar, endereco, ocupado }) {
  const [aberto, definirAberto] = useState(false);
  const id = useId();
  const localizacao = validarLocalizacao(lat, lon);
  return <section className="localizacao-revisao" aria-label="Localização para publicação">
    <p><strong>1. Localize a ONG para publicar no mapa</strong><br />{endereco || "Endereço não informado. Confira a localização com a instituição."}</p>
    <button type="button" className="botao" aria-expanded={aberto} aria-controls={`${id}-mapa`} onClick={() => definirAberto(!aberto)} disabled={ocupado}>{aberto ? "Fechar mapa" : "Selecionar localização no mapa"}</button>
    {aberto && <div id={`${id}-mapa`}>
      <p className="dica">Amplie até encontrar o endereço e clique no ponto da ONG. O centro inicial é apenas uma referência de Fortaleza. Você também pode digitar as coordenadas abaixo.</p>
      <MapContainer className="mapa-revisao" center={localizacao.valida ? [localizacao.lat, localizacao.lon] : [-3.77, -38.55]} zoom={localizacao.valida ? 15 : 12} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Seletor localizacao={localizacao} selecionar={(a, b) => { if (!ocupado) alterar(a, b); }} />
      </MapContainer>
    </div>}
    <div className="coordenadas-administracao">
      <label className="campo">Latitude *<input type="text" inputMode="decimal" value={lat} disabled={ocupado} onChange={(e) => alterar(e.target.value, lon)} aria-describedby={`${id}-ajuda`} /></label>
      <label className="campo">Longitude *<input type="text" inputMode="decimal" value={lon} disabled={ocupado} onChange={(e) => alterar(lat, e.target.value)} aria-describedby={`${id}-ajuda`} /></label>
    </div>
    <p id={`${id}-ajuda`} className="dica" role="status">{localizacao.mensagem}</p>
  </section>;
}
