import { useEffect, useState, useRef } from "react";
import {
  Link,
  NavLink,
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import { api, AREAS } from "./api";
import ResetPassword from "./pages/ResetPassword";

const pin = L.divIcon({
  className: "map-pin",
  html: "<span>↗</span>",
  iconSize: [36, 44],
  iconAnchor: [18, 44],
});
const emptyOng = {
  nome: "",
  area: "Educação",
  bairro: "",
  descricao: "",
  endereco: "",
  contato: "",
  site: "",
};
const areaIcon = (area) =>
  ({
    Educação: "▤",
    "Assistência social": "♡",
    "Meio ambiente": "♧",
    Saúde: "+",
    Cultura: "✳",
  })[area] || "↗";

// Logos locais identificadas pelo site oficial, sem depender do ID no banco.
const logos = { "https://projetoreviva.vercel.app": "/logos/projeto-reviva.png" };
function InstitutionIcon({ ong, className }) {
  const [failed, setFailed] = useState(false);
  const logo = logos[ong.site?.replace(/\/$/, "")];
  return logo && !failed ? (
    <span className={`${className} institution-logo`}>
      <img src={logo} alt={`Logo de ${ong.nome}`} onError={() => setFailed(true)} />
    </span>
  ) : <span className={className}>{areaIcon(ong.area)}</span>;
}

function Brand() {
  return (
    <Link className="brand" to="/">
      <svg
        width="33"
        height="33"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="10"
          width="18"
          height="11"
          rx="5.5"
          transform="rotate(-42 12 16)"
          stroke="currentColor"
          strokeWidth="2.4"
        />
        <rect
          x="12"
          y="10"
          width="18"
          height="11"
          rx="5.5"
          transform="rotate(-42 21 16)"
          stroke="currentColor"
          strokeWidth="2.4"
        />
      </svg>
      EloSocial<span className="brand-dot">.</span>
    </Link>
  );
}
function Notice({ children, success = false }) {
  return children ? (
    <div
      role={success ? "status" : "alert"}
      className={`notice ${success ? "success" : ""}`}
    >
      {children}
    </div>
  ) : null;
}
function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      Carregando informações…
    </div>
  );
}
function Intro({ eyebrow, title, text, children }) {
  return (
    <div className="intro">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {children}
    </div>
  );
}
function Field({
  label,
  name,
  values,
  setValues,
  type = "text",
  required = true,
  children,
  errors = {},
  ...rest
}) {
  const message = errors[name];
  const props = {
    id: name,
    name,
    value: values[name] ?? "",
    onChange: (e) => setValues({ ...values, [name]: e.target.value }),
    required,
    "aria-invalid": Boolean(message),
    "aria-describedby": message ? `${name}-error` : undefined,
    ...rest,
  };
  return (
    <label
      className={`field ${name === "descricao" || name === "referencias" ? "wide" : ""}`}
      htmlFor={name}
    >
      {label}
      {required && <span className="required"> *</span>}
      {children ? (
        <select {...props}>{children}</select>
      ) : type === "textarea" ? (
        <textarea {...props} rows={4} />
      ) : (
        <input {...props} type={type} />
      )}
      {message && <span className="field-error" id={`${name}-error`}>{message}</span>}
    </label>
  );
}
function OngCard({ ong }) {
  return (
    <article className="ong-card">
      <div className="card-top">
        <InstitutionIcon ong={ong} className="area-symbol" />
        <span className="tag">{ong.area}</span>
      </div>
      <p className="location">⌖ {ong.bairro} · Fortaleza</p>
      <h2>
        <Link to={`/ongs/${ong.id}`}>{ong.nome}</Link>
      </h2>
      <p className="card-description">{ong.descricao}</p>
      {ong.verificacao === "demonstrativo" && <small className="demo-label">Dados de exemplo</small>}
      {ong.verificacao === "nao_verificado" && <small className="demo-label">Verificação pendente</small>}
      <div className="card-bottom">
        <span>{ong.totalProjetos || 0} projeto(s)</span>
        <Link to={`/ongs/${ong.id}`} aria-label={`Conhecer ${ong.nome}`}>
          Conhecer ONG ↗
        </Link>
      </div>
    </article>
  );
}

// App é a estrutura compartilhada. Routes escolhe a tela a partir do endereço.
export default function App() {
  const location = useLocation();
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    let active = true;
    api("/auth/me").then(() => { if (active) setLoggedIn(true); })
      .catch(() => { if (active) setLoggedIn(false); });
    return () => { active = false; };
  }, [location.pathname]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
      <header className="header">
        <div className="header-inner">
          <Brand />
          <nav aria-label="Navegação principal">
            <NavLink to="/" end>
              Mapa
            </NavLink>
            <NavLink to="/catalogo">Catálogo</NavLink>
            <NavLink to="/solicitar">Cadastrar ONG</NavLink>
          </nav>
          <Link className="button dark small" to={loggedIn ? "/painel" : "/entrar"}>
            {loggedIn ? "Meu painel" : "Área da ONG"} <span>↗</span>
          </Link>
        </div>
      </header>
      <main id="conteudo">
        <Routes>
          <Route path="/" element={<Discover map />} />
          <Route path="/catalogo" element={<Discover />} />
          <Route path="/ongs/:id" element={<Profile />} />
          <Route path="/solicitar" element={<Request />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/criar-conta" element={<Register />} />
          <Route path="/recuperar-senha" element={<Recover />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />
          <Route path="/painel/*" element={<Dashboard />} />
          <Route
            path="*"
            element={
              <div className="container">
                <Intro eyebrow="404" title="Essa página não foi encontrada." />
                <Link className="button dark" to="/">
                  Voltar ao mapa
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer>
        <div className="footer-inner">
          <Brand />
          <p>
            Fortaleza tem muita gente fazendo a diferença.
            <br />
            Vamos aproximar essas histórias.
          </p>
          <Link to="/solicitar">Sua ONG pode estar aqui ↗</Link>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} EloSocial</span>
          <span>Projeto acadêmico · UNIFOR</span>
        </div>
      </footer>
    </>
  );
}

// A lista e os marcadores compartilham a ONG selecionada.
function OngMarker({ ong, selected, onSelect }) {
  const marker = useRef(null);
  const map = useMap();
  useEffect(() => {
    if (selected) {
      map.flyTo([ong.lat, ong.lon], 14, { duration: 0.6 });
      marker.current?.openPopup();
    }
  }, [selected, ong.lat, ong.lon, map]);
  return <Marker ref={marker} position={[ong.lat, ong.lon]} icon={pin}
    eventHandlers={{ click: onSelect }}>
    <Popup><span className="eyebrow">{ong.area}</span><h3>{ong.nome}</h3>
      {ong.verificacao === "demonstrativo" && <small className="demo-label">Dados de exemplo</small>}
      {ong.verificacao === "nao_verificado" && <small className="demo-label">Verificação pendente</small>}
      <p>{ong.bairro} · Fortaleza</p>
      <Link to={`/ongs/${ong.id}`}>Conhecer ONG e projetos ↗</Link>
    </Popup>
  </Marker>;
}

function Discover({ map = false }) {
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState(""),
    [area, setArea] = useState(""),
    [filter, setFilter] = useState(""),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setData(null);
    setError("");
    setSelectedId(null);
    const p = new URLSearchParams({ q: filter, limite: "100" });
    if (area) p.set("area", area);
    api(`/ongs?${p}`)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [filter, area, retry]);
  const ongs = data?.ongs || [];
  const mapped = ongs.filter(
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
      <section className="discovery-hero container">
        <span className="eyebrow">
          <span className="live-dot" /> FORTALEZA, CEARÁ
        </span>
        <h1>
          {map ? (
            <>
              Boas causas estão
              <br />
              <span>mais perto do que você imagina.</span>
            </>
          ) : (
            <>
              Encontre uma causa.
              <br />
              <span>Conheça quem faz acontecer.</span>
            </>
          )}
        </h1>
        <p>
          Conheça ONGs e projetos sociais da nossa cidade.
          <br className="desktop" /> Encontre iniciativas, descubra histórias e
          faça parte dessa rede.
        </p>
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter(query);
          }}
        >
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Buscar por ONG, área ou bairro"
            placeholder="Busque por ONG, área ou bairro"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="button dark">
            Buscar <span>→</span>
          </button>
        </form>
      </section>
      <section className="container discovery">
        <div className="section-toolbar">
          <div>
            <h2>{map ? "Explore o mapa" : "Conheça as instituições"}</h2>
            <span className="muted">
              {data
                ? `${data.total} instituição(ões) encontrada(s)`
                : "ONGs e projetos sociais de Fortaleza"}
            </span>
          </div>
          <div className="toolbar-actions">
            <select
              aria-label="Filtrar por área"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">Todas as áreas</option>
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <Link className="view-toggle" to={map ? "/catalogo" : "/"}>
              {map ? "☷ Catálogo" : "⌖ Mapa"}
            </Link>
          </div>
        </div>
        {(filter || area) && <div className="active-filters" role="status">
          <span>{filter && <>Busca: <strong>{filter}</strong> </>}{area && <> · Área: <strong>{area}</strong></>}</span>
          <button type="button" onClick={() => { setQuery(""); setFilter(""); setArea(""); }}>Limpar filtros ×</button>
        </div>}
        {error ? (
          <>
            <Notice>{error}</Notice>
            <button className="button" onClick={() => setRetry(retry + 1)}>
              Tentar novamente
            </button>
          </>
        ) : !data ? (
          <Loading />
        ) : map ? (
          <div className="map-layout">
            <aside className="map-list">
              <div className="list-heading">
                Iniciativas na cidade <span>{ongs.length}</span>
              </div>
              {ongs.length ? (
                ongs.map((o) => (
                  <article className={`map-list-card ${selectedId === o.id ? "selected" : ""}`} key={o.id}>
                    <InstitutionIcon ong={o} className="mini-symbol" />
                    <div>
                      <h3>{o.nome}</h3><p>⌖ {o.bairro}</p>
                      <span className="tag">{o.area}</span>
                      {o.verificacao === "demonstrativo" && <small>Dados de exemplo</small>}
                      {o.verificacao === "nao_verificado" && <small>Verificação pendente · posição aproximada</small>}
                      <div className="map-card-actions">
                        {mapped.some(item => item.id === o.id) && <button type="button"
                          aria-pressed={selectedId === o.id}
                          aria-label={`Mostrar ${o.nome} no mapa`}
                          onClick={() => setSelectedId(o.id)}>Ver no mapa</button>}
                        <Link to={`/ongs/${o.id}`}>Ver perfil ↗</Link>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty">
                  Nenhuma ONG encontrada. Tente outro bairro ou área.
                </p>
              )}
            </aside>
            <div className="map-wrap">
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
                {mapped.map((o) => (
                  <OngMarker key={o.id} ong={o} selected={selectedId === o.id}
                    onSelect={() => setSelectedId(o.id)} />
                ))}
              </MapContainer>
              <div className="map-label">⌖ Fortaleza, Ceará</div>
              {mapped.length < ongs.length && (
                <div className="map-note">
                  Algumas instituições ainda não têm posição cadastrada.
                </div>
              )}
            </div>
          </div>
        ) : ongs.length ? (
          <div className="cards">
            {ongs.map((o) => (
              <OngCard key={o.id} ong={o} />
            ))}
          </div>
        ) : (
          <div className="empty">
            Nenhuma instituição encontrada. Tente outra busca.
          </div>
        )}
        <div className="section-foot">
          <span>Pequenas conexões. Grandes mudanças.</span>
          <Link to="/solicitar">Conhece uma ONG? Solicite a inclusão ↗</Link>
        </div>
      </section>
      <section className="container">
        <div className="join-banner">
          <div>
            <span className="eyebrow">AMPLIE ESSA REDE</span>
            <h2>
              Seu trabalho merece
              <br />
              chegar a mais pessoas.
            </h2>
            <p>
              Cadastre sua instituição e ajude Fortaleza a conhecer sua causa.
            </p>
          </div>
          <Link className="button light" to="/solicitar">
            Solicitar inclusão da ONG ↗
          </Link>
        </div>
      </section>
    </>
  );
}

function Profile() {
  const { id } = useParams(),
    [ong, setOng] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    setOng(null);
    api(`/ongs/${id}`)
      .then((d) => live && setOng(d))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [id]);
  if (error)
    return (
      <div className="container">
        <Notice>{error}</Notice>
        <Link to="/catalogo">Voltar ao catálogo</Link>
      </div>
    );
  if (!ong)
    return (
      <div className="container">
        <Loading />
      </div>
    );
  const href = ong.site?.startsWith("@")
    ? `https://www.instagram.com/${ong.site.slice(1)}`
    : ong.site;
  return (
    <div className="container">
      <Link className="back" to="/catalogo">
        ← Voltar às instituições
      </Link>
      <section className="profile-hero">
        <InstitutionIcon ong={ong} className="profile-symbol" />
        <div>
          <span className="tag">{ong.area}</span>
          <div className="profile-title">
            <h1>{ong.nome}</h1>

          </div>
          <p>⌖ {ong.bairro} · Fortaleza, Ceará</p>
          {ong.verificacao === "demonstrativo" && (
            <p className="example-caption">Informações e localização usadas para demonstração, sem verificação institucional.</p>
          )}
          {ong.verificacao === "nao_verificado" && (
            <p className="example-caption">Verificação institucional pendente. O marcador indica uma localização aproximada; confirme o endereço e as informações diretamente com a iniciativa.</p>
          )}
        </div>
      </section>
      <div className="profile-columns">
        <div>
          <section className="content-section">
            <span className="eyebrow">CONHEÇA A INSTITUIÇÃO</span>
            <h2>Sobre a ONG</h2>
            <p className="preserve">{ong.descricao}</p>
          </section>
          <section className="content-section">
            <span className="eyebrow">INICIATIVAS</span>
            <h2>Projetos sociais</h2>
            {ong.projetos?.length ? (
              ong.projetos.map((p) => (
                <article className="project-public" key={p.id}>
                  <span>↗</span>
                  <div>
                    <h3>{p.nome}</h3>
                    <p>{p.descricao || "Sem descrição cadastrada."}</p>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty">Esta ONG ainda não publicou projetos.</p>
            )}
          </section>
        </div>
        <aside className="contact-card">
          <h2>Entre em contato</h2>
          <p>Conheça as formas de apoiar diretamente com a instituição.</p>
          <dl>
            <dt>Endereço público</dt>
            <dd>{ong.endereco || "Não informado"}</dd>
            <dt>Contato</dt>
            <dd>{ong.contato || "Não informado"}</dd>
            <dt>CNPJ</dt>
            <dd>{ong.cnpj || "Não informado"}</dd>
          </dl>
          {href && /^https?:\/\//.test(href) && (
            <a
              className="button dark"
              href={href}
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

function Request() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [v, setV] = useState({
      ...emptyOng,
    area: "",
      cnpj: "",
      responsavel: "",
      referencias: "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState(null);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      setResult(await api("/cadastro", { method: "POST", body: v }));
    } catch (e) {
      setError(e.message);
      setFieldErrors(e.fields || {});
    } finally {
      setBusy(false);
    }
  }
  if (result)
    return (
      <div className="container success-page">
        <span className="success-symbol">✓</span>
        <span className="eyebrow">PEDIDO RECEBIDO</span>
        <h1>Sua causa está um passo mais perto.</h1>
        <p>{result.mensagem}</p>
        <p>
          Protocolo <strong>#{result.protocolo}</strong>
        </p>
        <Link className="button dark" to="/">
          Voltar ao mapa →
        </Link>
      </div>
    );
  return (
    <div className="container">
      <Intro
        eyebrow="FAÇA PARTE"
        title="Solicitar inclusão de uma ONG"
        text="Apresente sua instituição. A equipe confere os dados antes de publicar a página no EloSocial."
      />
      <div className="request-layout">
        <aside className="how">
          <span className="eyebrow">PASSO A PASSO</span>
          <h2>Como funciona</h2>
          {[
            [
              "01",
              "Envio",
              "O representante preenche os dados da instituição.",
            ],
            [
              "02",
              "Conferência",
              "A equipe confere CNPJ, referências e endereço.",
            ],
            [
              "03",
              "Publicação",
              "Após a aprovação, a ONG passa a aparecer no site.",
            ],
          ].map(([n, t, d]) => (
            <div className="step" key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </aside>
        <form className="form-card" onSubmit={submit}>
          <Notice>{error}</Notice>
          <div className="form-grid">
            <Field errors={fieldErrors}
              label="Nome da instituição"
              name="nome"
              placeholder="Ex.: Instituto Comunidade Viva"
              values={v}
              setValues={setV}
              minLength={3}
              maxLength={120}
            />
            <Field errors={fieldErrors}
              label="CNPJ"
              name="cnpj"
              values={v}
              setValues={setV}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              minLength={14}
              maxLength={18}
            />
            <Field errors={fieldErrors}
              label="Área de atuação"
              name="area"
              values={v}
              setValues={setV}
            >
              <option value="" disabled>Selecione uma área</option>
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Field>
            <Field errors={fieldErrors}
              label="Bairro da sede"
              name="bairro"
              placeholder="Ex.: Benfica"
              values={v}
              setValues={setV}
              minLength={2}
            />
            <Field errors={fieldErrors}
              label="Descrição da instituição"
              name="descricao"
              type="textarea"
              values={v}
              setValues={setV}
              minLength={20}
              maxLength={1000}
              placeholder="Ex.: Oferecemos reforço escolar e oficinas de leitura para crianças e adolescentes do bairro. Descreva a atuação em pelo menos 20 caracteres."
            />
            <Field errors={fieldErrors}
              label="Endereço público (opcional)"
              name="endereco"
              placeholder="Ex.: Rua das Flores, 120, Fortaleza - CE"
              values={v}
              setValues={setV}
              required={false}
            />
            <Field errors={fieldErrors}
              label="Responsável pela solicitação"
              name="responsavel"
              placeholder="Ex.: Maria da Silva"
              values={v}
              setValues={setV}
              minLength={3}
            />
            <Field errors={fieldErrors}
              label="E-mail ou telefone de contato"
              name="contato"
              placeholder="Ex.: contato@instituicao.org ou (85) 99999-0000"
              values={v}
              setValues={setV}
              minLength={5}
            />
            <Field errors={fieldErrors}
              label="Site ou rede social (opcional)"
              name="site"
              values={v}
              setValues={setV}
              required={false}
              placeholder="Ex.: https://suaong.org.br ou @suaong"
            />
            <Field errors={fieldErrors}
              label="Referências públicas para conferência"
              name="referencias"
              type="textarea"
              values={v}
              setValues={setV}
              minLength={10}
              maxLength={1000}
              placeholder="Cole links de registros públicos, do site oficial ou de notícias que ajudem a confirmar a atuação da instituição."
            />
          </div>
          <p className="hint">
            Informe apenas dados que possam ser divulgados na página da ONG. O nome do responsável e as referências ficam restritos à equipe. O envio será analisado antes da publicação.
          </p>
          <div className="form-actions">
            <span className="hint">* Campos obrigatórios</span>
            <button className="button dark" disabled={busy}>
              {busy ? "Enviando…" : "Enviar solicitação →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Login() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [v, setV] = useState({ email: "", senha: "" }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      await api("/auth/login", { method: "POST", body: v });
      navigate("/painel");
    } catch (e) {
      setError(e.message);
      setFieldErrors(e.fields || {});
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container auth-layout">
      <div className="auth-message">
        <span className="eyebrow">ÁREA DA ONG</span>
        <h1>
          Seu trabalho conecta.
          <br />
          <span>Cuide dessa conexão.</span>
        </h1>
        <p>
          Atualize as informações da sua instituição e mantenha seus projetos
          perto de quem quer ajudar.
        </p>
        <div className="auth-art" aria-hidden="true">
          ↗
          <span>
            Uma cidade.
            <br />
            Muitas possibilidades.
          </span>
        </div>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">BEM-VINDO DE VOLTA</span>
        <h2>Entrar como gestor</h2>
        <p>Use o acesso vinculado à sua instituição.</p>
        <Notice>{error}</Notice>
        <Field errors={fieldErrors}
          label="E-mail"
          name="email"
          type="email"
          values={v}
          setValues={setV}
          autoComplete="username"
        />
        <Field errors={fieldErrors}
          label="Senha"
          name="senha"
          type="password"
          values={v}
          setValues={setV}
          autoComplete="current-password"
        />
        <Link className="forgot" to="/recuperar-senha">
          Esqueci minha senha
        </Link>
        <button className="button dark full" disabled={busy}>
          {busy ? "Entrando…" : "Entrar →"}
        </button>
        <p className="auth-bottom">
          Ainda não tem conta? <Link to="/criar-conta">Criar acesso</Link>
        </p>
        <p className="hint">
          A conta precisa ser vinculada a uma ONG pela equipe para liberar o
          painel.
        </p>
      </form>
    </div>
  );
}
function Register() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [v, setV] = useState({
      nome: "",
      email: "",
      telefone: "",
      senha: "",
      confirmarSenha: "",
    }),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (v.senha !== v.confirmarSenha) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      const d = await api("/auth/registrar", { method: "POST", body: v });
      setSuccess(d.mensagem);
    } catch (e) {
      setError(e.message);
      setFieldErrors(e.fields || {});
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container narrow">
      <Intro
        eyebrow="ÁREA DA ONG"
        title="Crie seu acesso"
        text="O acesso será vinculado à instituição após a conferência da equipe."
      />
      <form className="form-card" onSubmit={submit}>
        <Notice>{error}</Notice>
        <Notice success>{success}</Notice>
        {!success && (
          <>
            <Field errors={fieldErrors}
              label="Nome completo"
              name="nome"
              values={v}
              setValues={setV}
              minLength={3}
            />
            <Field errors={fieldErrors}
              label="E-mail"
              name="email"
              type="email"
              values={v}
              setValues={setV}
            />
            <Field errors={fieldErrors}
              label="Telefone com DDD"
              name="telefone"
              type="tel"
              values={v}
              setValues={setV}
            />
            <Field errors={fieldErrors}
              label="Senha"
              name="senha"
              type="password"
              values={v}
              setValues={setV}
              minLength={8}
            />
            <Field errors={fieldErrors}
              label="Confirmar senha"
              name="confirmarSenha"
              type="password"
              values={v}
              setValues={setV}
              minLength={8}
            />
            <p className="hint">
              Use ao menos oito caracteres, incluindo letras e números.
            </p>
            <button className="button dark full" disabled={busy}>
              {busy ? "Criando…" : "Criar conta →"}
            </button>
          </>
        )}
        <Link className="back" to="/entrar">
          ← Voltar para o login
        </Link>
      </form>
    </div>
  );
}
function Recover() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [v, setV] = useState({ email: "" }),
    [error, setError] = useState(""),
    [msg, setMsg] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="container narrow">
      <Intro
        eyebrow="ACESSO"
        title="Recuperar senha"
        text="Informe o e-mail usado no seu cadastro."
      />
      <form
        className="form-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
    setFieldErrors({});
          try {
            const d = await api("/auth/recuperar-senha", {
              method: "POST",
              body: v,
            });
            setMsg(
              d.mensagem ||
                "Se o e-mail estiver cadastrado, você receberá as instruções.",
            );
          } catch (e) {
            setError(e.message);
      setFieldErrors(e.fields || {});
          } finally {
            setBusy(false);
          }
        }}
      >
        <Notice>{error}</Notice>
        <Notice success>{msg}</Notice>
        <Field errors={fieldErrors}
          label="E-mail"
          name="email"
          type="email"
          values={v}
          setValues={setV}
        />
        <button className="button dark full" disabled={busy}>
          {busy ? "Enviando…" : "Enviar instruções"}
        </button>
        <p className="hint">
          Confira também a pasta de spam. Solicite e abra o link neste mesmo navegador.
        </p>
        <Link className="back" to="/entrar">
          ← Voltar para o login
        </Link>
      </form>
    </div>
  );
}

function Dashboard() {
  const [loggingOut, setLoggingOut] = useState(false);
  const [ong, setOng] = useState(null),
    [error, setError] = useState(""),
    [user, setUser] = useState(null);
  const navigate = useNavigate();
  async function load() {
    try {
      setOng(await api("/painel"));
      setError("");
    } catch (e) {
      if (e.status === 401) {
        navigate("/entrar");
        return;
      }
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
    api("/auth/me")
      .then(setUser)
      .catch(() => {});
  }, []);
  async function logout() {
    if (loggingOut) return;
    const confirmed = window.confirm("Deseja sair da sua conta?");
    if (!confirmed) return;
    setLoggingOut(true);
    setError("");
    try {
      await api("/auth/logout", { method: "POST", body: {} });
      navigate("/entrar", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoggingOut(false);
    }
  }
  return (
    <div className="container dashboard">
      <div className="dashboard-heading">
        <Intro
          eyebrow="PAINEL DO GESTOR"
          title={`Olá${user?.nome ? `, ${user.nome.split(" ")[0]}` : ", gestor"}.`}
          text="Um espaço para cuidar da sua instituição e dos seus projetos."
        />
        <button className="button" onClick={logout} disabled={loggingOut}>
          {loggingOut ? "Saindo…" : "Sair ↗"}
        </button>
      </div>
      <Notice>{error}</Notice>
      {!ong && !error ? (
        <Loading />
      ) : (
        ong && (
          <>
            <div className="institution-summary">
              <InstitutionIcon ong={ong} className="area-symbol" />
              <div>
                <span className="eyebrow">SUA INSTITUIÇÃO</span>
                <h2>{ong.nome}</h2>
                <p>
                  {ong.bairro} · {ong.area}
                </p>
              </div>
              <div className="summary-stat">
                <span>Situação</span>
                <strong>{ong.status}</strong>
              </div>
              <div className="summary-stat">
                <span>Projetos</span>
                <strong>{ong.projetos?.length || 0}</strong>
              </div>
            </div>
            <nav className="panel-tabs" aria-label="Painel">
              <NavLink to="/painel" end>
                Visão geral
              </NavLink>
              <NavLink to="/painel/editar">Editar instituição</NavLink>
              <NavLink to="/painel/projetos">Projetos</NavLink>
            </nav>
            <Routes>
              <Route
                index
                element={
                  <div className="dashboard-cards">
                    <Link to="/painel/editar">
                      <span>↗</span>
                      <h2>Editar instituição</h2>
                      <p>Descrição, área, endereço e contatos.</p>
                    </Link>
                    <Link to="/painel/projetos">
                      <span>＋</span>
                      <h2>Gerenciar projetos</h2>
                      <p>Crie, edite e remova iniciativas.</p>
                    </Link>
                    <Link to={`/ongs/${ong.id}`}>
                      <span>⌖</span>
                      <h2>Ver página pública</h2>
                      <p>Disponível para instituições aprovadas.</p>
                    </Link>
                  </div>
                }
              />
              <Route
                path="editar"
                element={<EditOng ong={ong} refresh={load} />}
              />
              <Route
                path="projetos"
                element={<Projects ong={ong} refresh={load} />}
              />
              <Route
                path="*"
                element={<Link to="/painel">Voltar ao painel</Link>}
              />
            </Routes>
          </>
        )
      )}
    </div>
  );
}
function EditOng({ ong, refresh }) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [v, setV] = useState(
      Object.fromEntries(Object.keys(emptyOng).map((k) => [k, ong[k] || ""])),
    ),
    [error, setError] = useState(""),
    [msg, setMsg] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="form-card"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
    setFieldErrors({});
        setMsg("");
        try {
          await api("/painel", { method: "PATCH", body: v });
          setMsg("Informações atualizadas com sucesso.");
          await refresh();
        } catch (e) {
          setError(e.message);
      setFieldErrors(e.fields || {});
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Informações da instituição</h2>
      <p className="hint">
        Status, CNPJ, verificação e posição no mapa são administrados pela
        equipe.
      </p>
      <Notice>{error}</Notice>
      <Notice success>{msg}</Notice>
      <div className="form-grid">
        {Object.entries({
          nome: "Nome",
          bairro: "Bairro",
          area: "Área de atuação",
          descricao: "Descrição",
          endereco: "Endereço",
          contato: "Contato",
          site: "Site ou rede social",
        }).map(([name, label]) => (
          <Field errors={fieldErrors}
            key={name}
            label={label}
            name={name}
            values={v}
            setValues={setV}
            type={name === "descricao" ? "textarea" : "text"}
            required={!["site", "endereco"].includes(name)}
            minLength={name === "descricao" ? 20 : undefined}
          >
            {name === "area"
              ? AREAS.map((a) => <option key={a}>{a}</option>)
              : null}
          </Field>
        ))}
      </div>
      <div className="form-actions">
        <Link to="/painel">Cancelar</Link>
        <button className="button dark" disabled={busy}>
          {busy ? "Salvando…" : "Salvar alterações →"}
        </button>
      </div>
    </form>
  );
}
function Projects({ ong, refresh }) {
  const [fieldErrors, setFieldErrors] = useState({});
  const deleteButton = useRef(null);
  const [editing, setEditing] = useState(undefined),
    [v, setV] = useState({ nome: "", descricao: "" }),
    [error, setError] = useState(""),
    [msg, setMsg] = useState(""),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState(null);
  function edit(project) {
    setEditing(project?.id ?? null);
    setV({ nome: project?.nome || "", descricao: project?.descricao || "" });
    setError("");
    setFieldErrors({});
    setMsg("");
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      await api(`/painel/projetos${editing ? `/${editing}` : ""}`, {
        method: editing ? "PATCH" : "POST",
        body: v,
      });
      setEditing(undefined);
      setMsg("Projeto salvo com sucesso.");
      await refresh();
    } catch (e) {
      setError(e.message);
      setFieldErrors(e.fields || {});
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!remove) deleteButton.current?.focus();
  }, [remove]);
  async function deleteProject() {
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      await api(`/painel/projetos/${remove.id}`, { method: "DELETE" });
      setRemove(null);
      setMsg("Projeto removido.");
      await refresh();
    } catch (e) {
      setError(e.message);
      setFieldErrors(e.fields || {});
      setRemove(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="section-toolbar">
        <div>
          <h2>Projetos da instituição</h2>
          <p className="muted">Mantenha suas iniciativas atualizadas.</p>
        </div>
        <button className="button dark" onClick={() => edit(null)}>
          ＋ Novo projeto
        </button>
      </div>
      <Notice>{error}</Notice>
      <Notice success>{msg}</Notice>
      {editing !== undefined && (
        <form className="form-card project-form" onSubmit={save}>
          <h2>{editing ? "Editar projeto" : "Novo projeto"}</h2>
          <Field errors={fieldErrors}
            label="Nome do projeto"
            name="nome"
            values={v}
            setValues={setV}
            minLength={2}
            maxLength={100}
          />
          <Field errors={fieldErrors}
            label="Descrição"
            name="descricao"
            type="textarea"
            values={v}
            setValues={setV}
            required={false}
            maxLength={500}
          />
          <div className="form-actions">
            <button
              type="button"
              className="button"
              onClick={() => setEditing(undefined)}
            >
              Cancelar
            </button>
            <button className="button dark" disabled={busy}>
              {busy ? "Salvando…" : "Salvar projeto"}
            </button>
          </div>
        </form>
      )}
      <div className="project-list">
        {ong.projetos?.length ? (
          ong.projetos.map((p) => (
            <article key={p.id}>
              <span className="area-symbol">↗</span>
              <div>
                <h3>{p.nome}</h3>
                <p>{p.descricao || "Sem descrição."}</p>
              </div>
              <div className="project-actions">
                <button className="button small" onClick={() => edit(p)}>
                  Editar
                </button>
                <button
                  className="button small danger"
                  onClick={(e) => { deleteButton.current = e.currentTarget; setRemove(p); }}
                >
                  Remover
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty">
            <h3>A primeira iniciativa começa aqui.</h3>
            <p>Cadastre um projeto para apresentá-lo na página da ONG.</p>
          </div>
        )}
      </div>
      {remove && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onKeyDown={(e) => {
              if (e.key === "Escape" && !busy) setRemove(null);
              // Mantém a navegação por Tab dentro da confirmação.
              if (e.key === "Tab") {
                const buttons = e.currentTarget.querySelectorAll("button:not(:disabled)");
                if (!buttons.length) { e.preventDefault(); return; }
                const first = buttons[0];
                const last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault(); last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault(); first.focus();
                }
              }
            }}
          >
            <h2 id="delete-title">Remover projeto?</h2>
            <p>
              O projeto “{remove.nome}” será removido. Essa ação não pode ser
              desfeita.
            </p>
            <div className="form-actions">
              <button
                autoFocus
                className="button"
                disabled={busy}
                onClick={() => setRemove(null)}
              >
                Cancelar
              </button>
              <button
                className="button dark"
                disabled={busy}
                onClick={deleteProject}
              >
                {busy ? "Removendo…" : "Confirmar remoção"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
