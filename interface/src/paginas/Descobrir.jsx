import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import { api, AREAS } from "../api";
import { Carregando, Aviso } from "../componentes/Comum";
import IconeInstituicao from "../componentes/IconeInstituicao";
import { formatarCnpj } from "../utilitarios/formatadores";

const pino = L.divIcon({
  className: "pino-mapa",
  html: "<span>↗</span>",
  iconSize: [36, 44],
  iconAnchor: [18, 44],
});
function CartaoOng({ ong }) {
  return (
    <article className="cartao-ong">
      <div className="topo-cartao">
        <IconeInstituicao ong={ong} classe="simbolo-area" />
        <span className="etiqueta">{ong.area}</span>
      </div>
      <p className="localizacao">⌖ {ong.bairro} · Fortaleza</p>
      <h2>
        <Link to={`/ongs/${ong.id}`}>{ong.nome}</Link>
      </h2>
      <p className="descricao-cartao">{ong.descricao}</p>
      {ong.verificacao === "demonstrativo" && (
        <small className="rotulo-exemplo">Dados de exemplo</small>
      )}
      {ong.verificacao === "nao_verificado" && (
        <small className="rotulo-exemplo">Verificação pendente</small>
      )}
      <div className="rodape-cartao">
        <span>{ong.totalProjetos || 0} projeto(s)</span>
        <Link to={`/ongs/${ong.id}`} aria-label={`Conhecer ${ong.nome}`}>
          Conhecer ONG ↗
        </Link>
      </div>
    </article>
  );
}

// A lista e os marcadores compartilham a ONG selecionada.
function MarcadorOng({ ong, selecionado, aoSelecionar }) {
  const marcador = useRef(null);
  const mapa = useMap();
  useEffect(() => {
    if (selecionado) {
      mapa.flyTo([ong.lat, ong.lon], 14, { duration: 0.6 });
      marcador.current?.openPopup();
    }
  }, [selecionado, ong.lat, ong.lon, mapa]);
  return (
    <Marker
      ref={marcador}
      position={[ong.lat, ong.lon]}
      icon={pino}
      eventHandlers={{ click: aoSelecionar }}
    >
      <Popup>
        <span className="sobretitulo">{ong.area}</span>
        <h3>{ong.nome}</h3>
        {ong.verificacao === "demonstrativo" && (
          <small className="rotulo-exemplo">Dados de exemplo</small>
        )}
        {ong.verificacao === "nao_verificado" && (
          <small className="rotulo-exemplo">Verificação pendente</small>
        )}
        <p>{ong.bairro} · Fortaleza</p>
        <Link to={`/ongs/${ong.id}`}>Conhecer ONG e projetos ↗</Link>
      </Popup>
    </Marker>
  );
}

export function Descobrir({ mapa = false }) {
  const [idSelecionado, definirIdSelecionado] = useState(null);
  const [consulta, definirConsulta] = useState(""),
    [area, definirArea] = useState(""),
    [filtro, definirFiltro] = useState(""),
    [dados, definirDados] = useState(null),
    [erro, definirErro] = useState(""),
    [tentativa, definirTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    definirDados(null);
    definirErro("");
    definirIdSelecionado(null);
    const p = new URLSearchParams({ q: filtro, limite: "100" });
    if (area) p.set("area", area);
    api(`/ongs?${p}`)
      .then((d) => ativo && definirDados(d))
      .catch((e) => ativo && definirErro(e.message));
    return () => {
      ativo = false;
    };
  }, [filtro, area, tentativa]);
  const ongs = dados?.ongs || [];
  const mapeadas = ongs.filter(
    (o) =>
      Number.isFinite(o.lat) &&
      Number.isFinite(o.lon) &&
      o.lat >= -4.1 &&
      o.lat <= -3.6 &&
      o.lon >= -38.8 &&
      o.lon <= -38.3,
  );
  return (
    <>
      <section className="abertura-descoberta conteudo">
        <span className="sobretitulo">
          <span className="ponto-ativo" /> FORTALEZA, CEARÁ
        </span>
        <h1>
          {mapa ? (
            <>
              Organizações sociais
              <br />
              <span>no mapa de Fortaleza.</span>
            </>
          ) : (
            <>
              Catálogo de organizações.
              <br />
              <span>Pesquise por área ou bairro.</span>
            </>
          )}
        </h1>
        <p>
          Consulte ONGs e projetos sociais de Fortaleza por nome, área ou
          bairro.
        </p>
        <form
          className="busca"
          onSubmit={(e) => {
            e.preventDefault();
            definirFiltro(consulta);
          }}
        >
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Buscar por ONG, área ou bairro"
            placeholder="Busque por ONG, área ou bairro"
            value={consulta}
            onChange={(e) => definirConsulta(e.target.value)}
          />

          <button className="botao escuro">
            Buscar <span>→</span>
          </button>
        </form>
      </section>
      <section className="conteudo descoberta">
        <div className="barra-secao">
          <div>
            <h2>{mapa ? "Explore o mapa" : "Conheça as instituições"}</h2>
            <span className="suave">
              {dados
                ? `${dados.total} instituição(ões) encontrada(s)`
                : "ONGs e projetos sociais de Fortaleza"}
            </span>
          </div>
          <div className="acoes-barra">
            <select
              aria-label="Filtrar por área"
              value={area}
              onChange={(e) => definirArea(e.target.value)}
            >
              <option value="">Todas as áreas</option>
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <Link
              className="alternar-visualizacao"
              to={mapa ? "/catalogo" : "/"}
            >
              {mapa ? "☷ Catálogo" : "⌖ Mapa"}
            </Link>
          </div>
        </div>
        {(filtro || area) && (
          <div className="filtros-ativos" role="status">
            <span>
              {filtro && (
                <>
                  Busca: <strong>{filtro}</strong>{" "}
                </>
              )}
              {area && (
                <>
                  {" "}
                  · Área: <strong>{area}</strong>
                </>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                definirConsulta("");
                definirFiltro("");
                definirArea("");
              }}
            >
              Limpar filtros ×
            </button>
          </div>
        )}
        {erro ? (
          <>
            <Aviso>{erro}</Aviso>
            <button
              className="botao"
              onClick={() => definirTentativa(tentativa + 1)}
            >
              Tentar novamente
            </button>
          </>
        ) : !dados ? (
          <Carregando />
        ) : mapa ? (
          <div className="estrutura-mapa">
            <aside className="lista-mapa">
              <div className="titulo-lista">
                Iniciativas na cidade <span>{ongs.length}</span>
              </div>
              {ongs.length ? (
                ongs.map((o) => (
                  <article
                    className={`cartao-lista-mapa ${idSelecionado === o.id ? "selecionado" : ""}`}
                    key={o.id}
                  >
                    <IconeInstituicao ong={o} classe="simbolo-pequeno" />
                    <div>
                      <h3>{o.nome}</h3>
                      <p>⌖ {o.bairro}</p>
                      <span className="etiqueta">{o.area}</span>
                      {o.verificacao === "demonstrativo" && (
                        <small>Dados de exemplo</small>
                      )}
                      {o.verificacao === "nao_verificado" && (
                        <small>Verificação pendente · posição aproximada</small>
                      )}
                      <div className="acoes-cartao-mapa">
                        {mapeadas.some((item) => item.id === o.id) && (
                          <button
                            type="button"
                            aria-pressed={idSelecionado === o.id}
                            aria-label={`Mostrar ${o.nome} no mapa`}
                            onClick={() => definirIdSelecionado(o.id)}
                          >
                            Ver no mapa
                          </button>
                        )}
                        <Link to={`/ongs/${o.id}`}>Ver perfil ↗</Link>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="vazio">
                  Nenhuma ONG encontrada. Tente outro bairro ou área.
                </p>
              )}
            </aside>
            <div className="area-mapa">
              <MapContainer
                center={[-3.768, -38.526]}
                zoom={12}
                scrollWheelZoom={true}
                zoomControl={false}
              >
                <ZoomControl position="topright" />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {mapeadas.map((o) => (
                  <MarcadorOng
                    key={o.id}
                    ong={o}
                    selecionado={idSelecionado === o.id}
                    aoSelecionar={() => definirIdSelecionado(o.id)}
                  />
                ))}
              </MapContainer>
              <div className="rotulo-mapa">⌖ Fortaleza, Ceará</div>
              {mapeadas.length < ongs.length && (
                <div className="aviso-mapa">
                  Algumas instituições ainda não têm posição cadastrada.
                </div>
              )}
            </div>
          </div>
        ) : ongs.length ? (
          <div className="cartoes">
            {ongs.map((o) => (
              <CartaoOng key={o.id} ong={o} />
            ))}
          </div>
        ) : (
          <div className="vazio">
            Nenhuma instituição encontrada. Tente outra busca.
          </div>
        )}
        <div className="rodape-secao">
          <span>Informações das instituições cadastradas.</span>
          <Link to="/solicitar">Conhece uma ONG? Solicite a inclusão ↗</Link>
        </div>
      </section>
      <section className="conteudo">
        <div className="faixa-cadastro">
          <div>
            <span className="sobretitulo">AMPLIE ESSA REDE</span>
            <h2>
              Sua instituição pode
              <br />
              entrar no catálogo.
            </h2>
            <p>Envie os dados da instituição para análise da equipe.</p>
          </div>
          <Link className="botao claro" to="/solicitar">
            Solicitar inclusão da ONG ↗
          </Link>
        </div>
      </section>
    </>
  );
}

export function Perfil() {
  const { id } = useParams(),
    [ong, definirOng] = useState(null),
    [erro, definirErro] = useState("");
  useEffect(() => {
    let ativo = true;
    definirOng(null);
    api(`/ongs/${id}`)
      .then((d) => ativo && definirOng(d))
      .catch((e) => ativo && definirErro(e.message));
    return () => {
      ativo = false;
    };
  }, [id]);
  if (erro)
    return (
      <div className="conteudo">
        <Aviso>{erro}</Aviso>
        <Link to="/catalogo">Voltar ao catálogo</Link>
      </div>
    );

  if (!ong)
    return (
      <div className="conteudo">
        <Carregando />
      </div>
    );

  const enderecoDoLink = ong.site?.startsWith("@")
    ? `https://www.instagram.com/${ong.site.slice(1)}`
    : ong.site;
  return (
    <div className="conteudo">
      <Link className="voltar" to="/catalogo">
        ← Voltar às instituições
      </Link>
      <section className="abertura-perfil">
        <IconeInstituicao ong={ong} classe="simbolo-perfil" />
        <div>
          <span className="etiqueta">{ong.area}</span>
          <div className="titulo-perfil">
            <h1>{ong.nome}</h1>
          </div>
          <p>⌖ {ong.bairro} · Fortaleza, Ceará</p>
          {ong.verificacao === "demonstrativo" && (
            <p className="legenda-exemplo">
              Informações e localização usadas para demonstração, sem
              verificação institucional.
            </p>
          )}
          {ong.verificacao === "nao_verificado" && (
            <p className="legenda-exemplo">
              Verificação institucional pendente. O marcador indica uma
              localização aproximada; confirme o endereço e as informações
              diretamente com a iniciativa.
            </p>
          )}
        </div>
      </section>
      <div className="colunas-perfil">
        <div>
          <section className="secao-conteudo">
            <span className="sobretitulo">CONHEÇA A INSTITUIÇÃO</span>
            <h2>Sobre a ONG</h2>
            <p className="preservar-quebras">{ong.descricao}</p>
          </section>
          <section className="secao-conteudo">
            <span className="sobretitulo">INICIATIVAS</span>
            <h2>Projetos sociais</h2>
            {ong.projetos?.length ? (
              ong.projetos.map((p) => (
                <article className="projeto-publico" key={p.id}>
                  <span>↗</span>
                  <div>
                    <h3>{p.nome}</h3>
                    <p>{p.descricao || "Sem descrição cadastrada."}</p>
                  </div>
                </article>
              ))
            ) : (
              <p className="vazio">Esta ONG ainda não publicou projetos.</p>
            )}
          </section>
        </div>
        <aside className="cartao-contato">
          <h2>Entre em contato</h2>
          <p>Conheça as formas de apoiar diretamente com a instituição.</p>
          <dl>
            <dt>Endereço público</dt>
            <dd>{ong.endereco || "Não informado"}</dd>
            <dt>Contato</dt>
            <dd>{ong.contato || "Não informado"}</dd>
            <dt>CNPJ</dt>
            <dd>{ong.cnpj ? formatarCnpj(ong.cnpj) : "Não informado"}</dd>
          </dl>
          {enderecoDoLink && /^https?:\/\//.test(enderecoDoLink) && (
            <a
              className="botao escuro"
              href={enderecoDoLink}
              target="_blank"
              rel="noreferrer"
            >
              Site ou rede social ↗
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}
