import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { api, AREAS } from "../api";
import { Campo, Introducao, Carregando, Aviso } from "../componentes/Comum";
import IconeInstituicao from "../componentes/IconeInstituicao";
import { ongVazia } from "../utilitarios/constantes";

export default function PainelGestor() {
  const [saindo, definirSaindo] = useState(false);
  const [ong, definirOng] = useState(null),
    [erro, definirErro] = useState(""),
    [usuario, definirUsuario] = useState(null),
    [contaConsultada, definirContaConsultada] = useState(false),
    [pendente, definirPendente] = useState(false);
  const navegar = useNavigate();
  const cadastro = new URLSearchParams(window.location.search);
  const ongEnviada = cadastro.get("cadastro") === "ong";
  async function carregar() {
    try {
      const dados = await api("/painel");
      definirOng(dados.situacao === "sem_ong" ? null : dados);
      definirPendente(dados.situacao === "sem_ong");
      definirErro("");
    } catch (e) {
      if (e.status === 401) {
        if (new URLSearchParams(window.location.search).has("cadastro")) {
          definirPendente(true);
          return;
        }
        navegar("/entrar");
        return;
      }
      if (e.status === 404) {
        definirPendente(true);
        definirErro("");
        return;
      }
      definirErro(e.message);
    }
  }
  useEffect(() => {
    carregar();
    api("/auth/me")
      .then((conta) => {
        if (conta.papel === "admin" && !ongEnviada)
          navegar("/admin", { replace: true });
        else definirUsuario(conta);
      })
      .catch(() => {})
      .finally(() => definirContaConsultada(true));
  }, []);
  async function sair() {
    if (saindo) return;
    const confirmado = window.confirm("Deseja sair da sua conta?");
    if (!confirmado) return;
    definirSaindo(true);
    definirErro("");
    try {
      await api("/auth/logout", { method: "POST", body: {} });
      navegar("/entrar", { replace: true });
    } catch (e) {
      definirErro(e.message);
    } finally {
      definirSaindo(false);
    }
  }
  return (
    <div className="conteudo painel">
      <div className="cabecalho-painel">
        <Introducao
          sobretitulo={ongEnviada ? "SOLICITAÇÃO DE ONG" : "PAINEL DO GESTOR"}
          titulo={
            ongEnviada
              ? "ONG enviada."
              : `Olá${usuario?.nome ? `, ${usuario.nome.split(" ")[0]}` : ", gestor"}.`
          }
          texto={
            ongEnviada
              ? "A equipe vai conferir os dados antes de publicar a instituição."
              : "Um espaço para cuidar da sua instituição e dos seus projetos."
          }
        />

        {usuario && (
          <button className="botao" onClick={sair} disabled={saindo}>
            {saindo ? "Saindo…" : "Sair ↗"}
          </button>
        )}
      </div>
      <Aviso>{erro}</Aviso>
      {(pendente && !ong) || ongEnviada ? (
        <div className="cartao-formulario cartao-pendente">
          <span className="sobretitulo">
            {ongEnviada ? "EM VERIFICAÇÃO" : "AGUARDANDO CADASTRO DA ONG"}
          </span>
          <h2>
            {ongEnviada
              ? "ONG enviada para verificação"
              : usuario
                ? "Sua conta está ativa"
                : "Confirme seu e-mail"}
          </h2>
          <p>
            {ongEnviada
              ? usuario
                ? "A equipe analisará os dados da ONG e decidirá se ela será publicada."
                : "A equipe analisará os dados da ONG. Crie sua conta com o e-mail de contato informado para que a administração possa vinculá-la após a análise."
              : usuario
                ? "Cadastre sua ONG para que a equipe confira os dados e libere a edição no painel."
                : "Depois de confirmar seu e-mail, entre na conta e cadastre a ONG para análise."}
          </p>
          {ongEnviada && cadastro.get("protocolo") && (
            <p>
              Protocolo <strong>#{cadastro.get("protocolo")}</strong>
            </p>
          )}
          {contaConsultada && (
            <div className="acoes-formulario">
              {usuario && !ongEnviada && (
                <button className="botao" onClick={carregar}>
                  Atualizar situação
                </button>
              )}
              {usuario ? (
                ongEnviada ? (
                  <Link
                    className="botao escuro"
                    to={usuario.papel === "admin" ? "/admin" : "/painel"}
                  >
                    {usuario.papel === "admin"
                      ? "Ir para a administração"
                      : "Voltar ao painel"}
                  </Link>
                ) : (
                  <Link className="botao" to="/solicitar">
                    Cadastrar ONG
                  </Link>
                )
              ) : (
                <>
                  <Link
                    className="botao"
                    to={ongEnviada ? "/criar-conta" : "/solicitar"}
                  >
                    {ongEnviada ? "Criar acesso" : "Cadastrar ONG"}
                  </Link>
                  <Link className="botao escuro" to="/entrar">
                    Entrar após confirmar o e-mail
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      ) : !ong && !erro ? (
        <Carregando />
      ) : (
        ong && (
          <>
            <div className="resumo-instituicao">
              <IconeInstituicao ong={ong} classe="simbolo-area" />
              <div>
                <span className="sobretitulo">SUA INSTITUIÇÃO</span>
                <h2>{ong.nome}</h2>
                <p>
                  {ong.bairro} · {ong.area}
                </p>
              </div>
              <div className="numero-resumo">
                <span>Situação</span>
                <strong>
                  {ong.status === "pendente"
                    ? "Em verificação"
                    : ong.status === "aprovada"
                      ? "Aprovada"
                      : "Rejeitada"}
                </strong>
              </div>
              <div className="numero-resumo">
                <span>Projetos</span>
                <strong>{ong.projetos?.length || 0}</strong>
              </div>
            </div>
            {ong.status === "pendente" && (
              <Aviso sucesso>
                Em verificação: a equipe ainda precisa aprovar sua ONG.
              </Aviso>
            )}
            {ong.status === "rejeitada" && (
              <Aviso>Cadastro não aprovado. {ong.motivo_rejeicao}</Aviso>
            )}
            {ong.status === "aprovada" && (
              <>
                <nav className="abas-painel" aria-label="Painel">
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
                      <div className="cartoes-painel">
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
                        {ong.status === "aprovada" && (
                          <Link to={`/ongs/${ong.id}`}>
                            <span>⌖</span>
                            <h2>Ver página pública</h2>
                            <p>Disponível para instituições aprovadas.</p>
                          </Link>
                        )}
                      </div>
                    }
                  />

                  <Route
                    path="editar"
                    element={<EditarOng ong={ong} atualizar={carregar} />}
                  />

                  <Route
                    path="projetos"
                    element={<Projetos ong={ong} atualizar={carregar} />}
                  />

                  <Route
                    path="*"
                    element={<Link to="/painel">Voltar ao painel</Link>}
                  />
                </Routes>
              </>
            )}
          </>
        )
      )}
    </div>
  );
}
function EditarOng({ ong, atualizar }) {
  const [errosDosCampos, definirErrosDosCampos] = useState({});
  const [valoresDoFormulario, definirValoresDoFormulario] = useState(
      Object.fromEntries(Object.keys(ongVazia).map((k) => [k, ong[k] || ""])),
    ),
    [erro, definirErro] = useState(""),
    [mensagem, definirMensagem] = useState(""),
    [ocupado, definirOcupado] = useState(false);
  return (
    <form
      className="cartao-formulario"
      onSubmit={async (e) => {
        e.preventDefault();
        definirOcupado(true);
        definirErro("");
        definirErrosDosCampos({});
        definirMensagem("");
        try {
          await api("/painel", { method: "PATCH", body: valoresDoFormulario });
          definirMensagem("Informações atualizadas com sucesso.");
          await atualizar();
        } catch (e) {
          definirErro(e.message);
          definirErrosDosCampos(e.fields || {});
        } finally {
          definirOcupado(false);
        }
      }}
    >
      <h2>Informações da instituição</h2>
      <p className="dica">
        Situação, CNPJ, verificação e posição no mapa são administrados pela
        equipe.
      </p>
      <Aviso>{erro}</Aviso>
      <Aviso sucesso>{mensagem}</Aviso>
      <div className="grade-formulario">
        {Object.entries({
          nome: "Nome",
          bairro: "Bairro",
          area: "Área de atuação",
          descricao: "Descrição",
          endereco: "Endereço",
          contato: "Contato",
          site: "Site ou rede social",
        }).map(([nome, rotulo]) => (
          <Campo
            erros={errosDosCampos}
            key={nome}
            rotulo={rotulo}
            nome={nome}
            valores={valoresDoFormulario}
            definirValores={definirValoresDoFormulario}
            tipo={nome === "descricao" ? "textarea" : "text"}
            prefixoUrl={nome === "site"}
            obrigatorio={!["site", "endereco"].includes(nome)}
            minLength={nome === "descricao" ? 20 : undefined}
          >
            {nome === "area"
              ? AREAS.map((a) => <option key={a}>{a}</option>)
              : null}
          </Campo>
        ))}
      </div>
      <div className="acoes-formulario">
        <Link to="/painel">Cancelar</Link>
        <button className="botao escuro" disabled={ocupado}>
          {ocupado ? "Salvando…" : "Salvar alterações →"}
        </button>
      </div>
    </form>
  );
}
function Projetos({ ong, atualizar }) {
  const [errosDosCampos, definirErrosDosCampos] = useState({});
  const botaoExcluir = useRef(null);
  const [emEdicao, definirEmEdicao] = useState(undefined),
    [valoresDoFormulario, definirValoresDoFormulario] = useState({
      nome: "",
      descricao: "",
    }),
    [erro, definirErro] = useState(""),
    [mensagem, definirMensagem] = useState(""),
    [ocupado, definirOcupado] = useState(false),
    [remover, definirRemover] = useState(null);
  function editar(projeto) {
    definirEmEdicao(projeto?.id ?? null);
    definirValoresDoFormulario({
      nome: projeto?.nome || "",
      descricao: projeto?.descricao || "",
    });
    definirErro("");
    definirErrosDosCampos({});
    definirMensagem("");
  }
  async function salvar(e) {
    e.preventDefault();
    definirOcupado(true);
    definirErro("");
    definirErrosDosCampos({});
    try {
      await api(`/painel/projetos${emEdicao ? `/${emEdicao}` : ""}`, {
        method: emEdicao ? "PATCH" : "POST",
        body: valoresDoFormulario,
      });
      definirEmEdicao(undefined);
      definirMensagem("Projeto salvo com sucesso.");
      await atualizar();
    } catch (e) {
      definirErro(e.message);
      definirErrosDosCampos(e.fields || {});
    } finally {
      definirOcupado(false);
    }
  }
  useEffect(() => {
    if (!remover) botaoExcluir.current?.focus();
  }, [remover]);
  async function excluirProjeto() {
    definirOcupado(true);
    definirErro("");
    definirErrosDosCampos({});
    try {
      await api(`/painel/projetos/${remover.id}`, { method: "DELETE" });
      definirRemover(null);
      definirMensagem("Projeto removido.");
      await atualizar();
    } catch (e) {
      definirErro(e.message);
      definirErrosDosCampos(e.fields || {});
      definirRemover(null);
    } finally {
      definirOcupado(false);
    }
  }
  return (
    <section>
      <div className="barra-secao">
        <div>
          <h2>Projetos da instituição</h2>
          <p className="suave">Mantenha suas iniciativas atualizadas.</p>
        </div>
        <button className="botao escuro" onClick={() => editar(null)}>
          ＋ Novo projeto
        </button>
      </div>
      <Aviso>{erro}</Aviso>
      <Aviso sucesso>{mensagem}</Aviso>
      {emEdicao !== undefined && (
        <form
          className="cartao-formulario formulario-projeto"
          onSubmit={salvar}
        >
          <h2>{emEdicao ? "Editar projeto" : "Novo projeto"}</h2>
          <Campo
            erros={errosDosCampos}
            rotulo="Nome do projeto"
            nome="nome"
            valores={valoresDoFormulario}
            definirValores={definirValoresDoFormulario}
            minLength={2}
            maxLength={100}
          />

          <Campo
            erros={errosDosCampos}
            rotulo="Descrição"
            nome="descricao"
            tipo="textarea"
            valores={valoresDoFormulario}
            definirValores={definirValoresDoFormulario}
            obrigatorio={false}
            maxLength={500}
          />

          <div className="acoes-formulario">
            <button
              type="button"
              className="botao"
              onClick={() => definirEmEdicao(undefined)}
            >
              Cancelar
            </button>
            <button className="botao escuro" disabled={ocupado}>
              {ocupado ? "Salvando…" : "Salvar projeto"}
            </button>
          </div>
        </form>
      )}
      <div className="lista-projeto">
        {ong.projetos?.length ? (
          ong.projetos.map((p) => (
            <article key={p.id}>
              <span className="simbolo-area">↗</span>
              <div>
                <h3>{p.nome}</h3>
                <p>{p.descricao || "Sem descrição."}</p>
              </div>
              <div className="acoes-projeto">
                <button className="botao pequeno" onClick={() => editar(p)}>
                  Editar
                </button>
                <button
                  className="botao pequeno perigo"
                  onClick={(e) => {
                    botaoExcluir.current = e.currentTarget;
                    definirRemover(p);
                  }}
                >
                  Remover
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="vazio">
            <h3>Nenhum projeto cadastrado.</h3>
            <p>Cadastre um projeto para apresentá-lo na página da ONG.</p>
          </div>
        )}
      </div>
      {remover && (
        <div className="fundo-modal">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onKeyDown={(e) => {
              if (e.key === "Escape" && !ocupado) definirRemover(null);
              // Mantém a navegação por Tab dentro da confirmação.
              if (e.key === "Tab") {
                const botoes = e.currentTarget.querySelectorAll(
                  "button:not(:disabled)",
                );
                if (!botoes.length) {
                  e.preventDefault();
                  return;
                }
                const primeiro = botoes[0];
                const ultimo = botoes[botoes.length - 1];
                if (e.shiftKey && document.activeElement === primeiro) {
                  e.preventDefault();
                  ultimo.focus();
                } else if (!e.shiftKey && document.activeElement === ultimo) {
                  e.preventDefault();
                  primeiro.focus();
                }
              }
            }}
          >
            <h2 id="delete-title">Remover projeto?</h2>
            <p>
              O projeto “{remover.nome}” será removido. Essa ação não pode ser
              desfeita.
            </p>
            <div className="acoes-formulario">
              <button
                autoFocus
                className="botao"
                disabled={ocupado}
                onClick={() => definirRemover(null)}
              >
                Cancelar
              </button>
              <button
                className="botao escuro"
                disabled={ocupado}
                onClick={excluirProjeto}
              >
                {ocupado ? "Removendo…" : "Confirmar remoção"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
