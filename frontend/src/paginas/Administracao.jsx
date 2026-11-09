import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { formatarCnpj } from "../utilitarios/formatadores";

const situacoes = [
  ["pendente", "Em verificação"],
  ["aprovada", "Aprovadas"],
  ["rejeitada", "Rejeitadas"],
];

function CartaoRevisao({ ong, atualizar }) {
  const dadosPrivados = Array.isArray(ong.ongs_privado)
    ? ong.ongs_privado[0]
    : ong.ongs_privado;
  const [lat, definirLatitude] = useState(ong.lat ?? "");
  const [lon, definirLongitude] = useState(ong.lon ?? "");
  const [email, definirEmail] = useState("");
  const [verificacao, definirVerificacao] = useState("nao_verificado");
  const [motivo, definirMotivo] = useState("");
  const [ocupado, definirOcupado] = useState(false);
  const [erro, definirErro] = useState("");
  const [mensagem, definirMensagem] = useState("");

  async function executar(acao) {
    definirOcupado(true);
    definirErro("");
    definirMensagem("");
    try {
      if (acao === "vincular") {
        await api(`/admin/ongs/${ong.id}/gestor`, {
          method: "POST",
          body: { email: email.trim() },
        });
        definirMensagem("Gestor vinculado.");
      } else if (acao === "aprovar") {
        if (lat === "" || lon === "")
          throw new Error(
            "Informe latitude e longitude conferidas antes de aprovar.",
          );
        await api(`/admin/ongs/${ong.id}`, {
          method: "PATCH",
          body: {
            acao: "aprovar",
            lat: Number(lat),
            lon: Number(lon),
            verificacao,
          },
        });
        definirMensagem("ONG aprovada e publicada.");
      } else {
        await api(`/admin/ongs/${ong.id}`, {
          method: "PATCH",
          body: { acao: "rejeitar", motivo: motivo.trim() },
        });
        definirMensagem("ONG rejeitada.");
      }
      await atualizar();
    } catch (e) {
      definirErro(e.message);
    } finally {
      definirOcupado(false);
    }
  }

  return (
    <article className="cartao-administracao">
      <div className="cabecalho-cartao-administracao">
        <div>
          <span className="sobretitulo">PEDIDO #{ong.id}</span>
          <h2>{ong.nome}</h2>
          <p>
            {ong.area} · {ong.bairro}
          </p>
        </div>
        <span className="etiqueta">
          {situacoes.find(([chave]) => chave === ong.status)?.[1]}
        </span>
      </div>
      <p>{ong.descricao}</p>
      <dl className="detalhes-administracao">
        <div>
          <dt>CNPJ</dt>
          <dd>{formatarCnpj(ong.cnpj)}</dd>
        </div>
        <div>
          <dt>Contato</dt>
          <dd>{ong.contato}</dd>
        </div>
        <div>
          <dt>Endereço</dt>
          <dd>{ong.endereco || "Não informado"}</dd>
        </div>
        <div>
          <dt>Site</dt>
          <dd>{ong.site || "Não informado"}</dd>
        </div>
        <div>
          <dt>Responsável</dt>
          <dd>{dadosPrivados?.responsavel || "Não informado"}</dd>
        </div>
        <div>
          <dt>Referências</dt>
          <dd>{dadosPrivados?.referencias || "Não informadas"}</dd>
        </div>
      </dl>
      {ong.projetos?.length > 0 && (
        <section className="projetos-revisao">
          <h3>Projetos informados</h3>
          <ul>
            {ong.projetos.map((projeto) => (
              <li key={projeto.id}>
                <strong>{projeto.nome}</strong>
                {projeto.descricao && <p>{projeto.descricao}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {erro && (
        <div className="aviso" role="alert">
          {erro}
        </div>
      )}
      {mensagem && (
        <div className="aviso sucesso" role="status">
          {mensagem}
        </div>
      )}
      {(ong.status === "pendente" || ong.status === "aprovada") && (
        <div className="acoes-administracao">
          <div>
            {ong.owner_id ? (
              <p className="gestor-vinculado">
                Gestor já vinculado a esta ONG.
              </p>
            ) : (
              <>
                <h3>Vincular gestor</h3>
                <p>
                  Para cadastros antigos, use uma conta confirmada e autorizada
                  pela ONG.
                </p>
                <label className="campo">
                  E-mail do gestor
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => definirEmail(e.target.value)}
                    placeholder="gestor@ong.org.br"
                  />
                </label>
                <button
                  className="botao"
                  disabled={ocupado || !email}
                  onClick={() => executar("vincular")}
                >
                  Vincular gestor
                </button>
              </>
            )}
          </div>
          {ong.status === "pendente" && (
            <div>
              <h3>Decidir cadastro</h3>
              <p>
                {ong.lat == null || ong.lon == null
                  ? "Digite a latitude e a longitude conferidas no mapa. Os números em cinza nos campos são apenas exemplos."
                  : "Coordenadas sugeridas pela busca do endereço no mapa. Confira a posição antes de aprovar."}
              </p>
              <div className="coordenadas-administracao">
                <label className="campo">
                  Latitude
                  <input
                    type="number"
                    step="any"
                    min="-4.1"
                    max="-3.6"
                    value={lat}
                    onChange={(e) => definirLatitude(e.target.value)}
                    placeholder="-3.73"
                  />
                </label>
                <label className="campo">
                  Longitude
                  <input
                    type="number"
                    step="any"
                    min="-38.8"
                    max="-38.3"
                    value={lon}
                    onChange={(e) => definirLongitude(e.target.value)}
                    placeholder="-38.52"
                  />
                </label>
              </div>
              <label className="campo">
                Verificação institucional
                <select
                  value={verificacao}
                  onChange={(e) => definirVerificacao(e.target.value)}
                >
                  <option value="nao_verificado">
                    Dados públicos conferidos; vínculo não confirmado
                  </option>
                  <option value="verificado">
                    Vínculo com a instituição confirmado pela equipe
                  </option>
                </select>
              </label>
              {(lat === "" || lon === "") && (
                <p className="dica">
                  Preencha os dois campos para liberar “Aprovar e publicar”.
                </p>
              )}
              <button
                className="botao escuro"
                disabled={ocupado || lat === "" || lon === ""}
                onClick={() => executar("aprovar")}
              >
                Aprovar e publicar
              </button>
              <label className="campo">
                Motivo da recusa
                <input
                  value={motivo}
                  onChange={(e) => definirMotivo(e.target.value)}
                  minLength={5}
                  maxLength={500}
                  placeholder="Explique a decisão"
                />
              </label>
              <button
                className="botao perigo"
                disabled={ocupado || motivo.trim().length < 5}
                onClick={() => executar("rejeitar")}
              >
                Não aprovar
              </button>
            </div>
          )}
        </div>
      )}
      {ong.status === "aprovada" && (
        <Link className="botao" to={`/ongs/${ong.id}`}>
          Ver página pública ↗
        </Link>
      )}
    </article>
  );
}

export default function Administracao() {
  const [situacao, definirSituacao] = useState("pendente");
  const [ongs, definirOngs] = useState(null);
  const [erro, definirErro] = useState("");
  const [ocupado, definirOcupado] = useState(false);
  const navegar = useNavigate();
  async function carregar() {
    definirOcupado(true);
    definirErro("");
    try {
      definirOngs(await api(`/admin/ongs?status=${situacao}`));
    } catch (e) {
      if (e.status === 401) navegar("/entrar", { replace: true });
      else
        definirErro(
          e.status === 403
            ? "Esta conta não tem acesso à administração."
            : e.message,
        );
    } finally {
      definirOcupado(false);
    }
  }
  useEffect(() => {
    carregar();
  }, [situacao]);
  async function sair() {
    try {
      await api("/auth/logout", { method: "POST", body: {} });
      navegar("/entrar", { replace: true });
    } catch (e) {
      definirErro(e.message);
    }
  }
  return (
    <div className="conteudo painel">
      <div className="cabecalho-painel">
        <div className="introducao">
          <span className="sobretitulo">ADMINISTRAÇÃO</span>
          <h1>Revisão das ONGs</h1>
          <p>
            Confira as informações e decida quais cadastros serão publicados.
          </p>
        </div>
        <button className="botao" onClick={sair}>
          Sair
        </button>
      </div>
      <nav className="abas-painel" aria-label="Situação das ONGs">
        {situacoes.map(([chave, rotulo]) => (
          <button
            key={chave}
            type="button"
            className={chave === situacao ? "ativo" : ""}
            onClick={() => {
              definirSituacao(chave);
              definirOngs(null);
            }}
          >
            {rotulo}
          </button>
        ))}
      </nav>
      {erro && (
        <div className="aviso" role="alert">
          {erro}
        </div>
      )}
      {ocupado && !ongs ? (
        <div className="carregando" role="status">
          <span className="indicador-carregamento" />
          Carregando cadastros…
        </div>
      ) : ongs?.length ? (
        <div className="lista-administracao">
          {ongs.map((ong) => (
            <CartaoRevisao key={ong.id} ong={ong} atualizar={carregar} />
          ))}
        </div>
      ) : (
        !erro && <div className="vazio">Nenhuma ONG nesta situação.</div>
      )}
    </div>
  );
}
