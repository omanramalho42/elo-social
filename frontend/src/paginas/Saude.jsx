import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Marca } from "../componentes/Comum";
import { funcionalidades, gruposFuncionais, integrarTexto, integracoes, tabelas } from "../dados/sistema";
import "./Saude.css";

const build = __ELOSOCIAL_BUILD__;
const secoes = [["visao-geral", "Disponibilidade"], ["publicacoes", "Deploys"], ["arquitetura", "Arquitetura"], ["funcoes", "Funcionalidades"], ["rotas", "Rotas da API"], ["integracoes", "Integrações"], ["banco", "Banco e segurança"]];
const dataHora = (valor) => valor && !Number.isNaN(Date.parse(valor)) ? new Date(valor).toLocaleString("pt-BR") : "Não informado pelo ambiente";
const rotasLocais = [...new Map(funcionalidades.flatMap((f) => f.rotas.map((rota) => [rota, { metodo: rota.split(" ")[0], caminho: rota.split(" ")[1], resumo: f.nome, acesso: f.grupo === "Administração" ? "Administrador" : f.grupo === "Gestão da instituição" ? "Conta autenticada" : "Consultar contrato" }]))).values()];

function Estado({ situacao, carregando = false }) {
  const texto = carregando ? "Consultando" : situacao === "ok" ? "Disponível" : situacao === "indisponivel" ? "Indisponível" : "Sem consulta";
  return <span className={`saude-estado ${carregando ? "aguardando" : situacao || "neutro"}`}><span aria-hidden="true" />{texto}</span>;
}
function Endereco({ valor }) {
  if (!valor) return <span>Não informado pelo ambiente</span>;
  try { const url = new URL(valor); if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return <span>Endereço inválido</span>; }
  catch { return <span>Endereço inválido</span>; }
  return <a href={valor} target="_blank" rel="noreferrer">{valor.replace(/^https?:\/\//, "")} <span aria-hidden="true">↗</span></a>;
}
function Versao({ commit, ramo }) {
  return <><div><dt>Commit</dt><dd><code>{commit ? commit.slice(0, 12) : "Não informado pelo ambiente"}</code></dd></div><div><dt>Branch</dt><dd>{ramo || "Não informada pelo ambiente"}</dd></div></>;
}

export default function Saude() {
  const [tentativa, definirTentativa] = useState(0);
  const [dados, definirDados] = useState(null);
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState("");
  const [buscaFuncoes, definirBuscaFuncoes] = useState("");
  const [grupo, definirGrupo] = useState("");
  const [buscaRotas, definirBuscaRotas] = useState("");
  const [metodo, definirMetodo] = useState("");
  useEffect(() => {
    const controlador = new AbortController();
    let ativo = true;
    const limite = setTimeout(() => controlador.abort(), 65000);
    definirCarregando(true);
    definirDados(null);
    definirErro("");
    async function consultar() {
      try {
        const resposta = await fetch("/api/saude/detalhes", { cache: "no-store", credentials: "omit", signal: controlador.signal });
        const relatorio = await resposta.json();
        if (![200, 503].includes(resposta.status) || !["ok", "parcial"].includes(relatorio.situacao) || !Array.isArray(relatorio.rotas) || !relatorio.servicos || !relatorio.publicacao || !relatorio.banco)
          throw new Error("Relatório inválido");
        if (ativo) definirDados(relatorio);
      } catch {
        if (ativo) definirErro("Não foi possível obter o diagnóstico da API. Aguarde a inicialização do Render e tente atualizar. O catálogo abaixo continua disponível como referência do código.");
      } finally {
        clearTimeout(limite);
        if (ativo) definirCarregando(false);
      }
    }
    consultar();
    return () => { ativo = false; clearTimeout(limite); controlador.abort(); };
  }, [tentativa]);
  const listaFuncoes = funcionalidades.filter((f) => (!grupo || f.grupo === grupo) && integrarTexto([f.nome, f.descricao, f.tela, ...f.rotas].join(" ")).includes(integrarTexto(buscaFuncoes)));
  const inventario = dados?.rotas || rotasLocais;
  const listaRotas = inventario.filter((r) => (!metodo || r.metodo === metodo) && integrarTexto(`${r.metodo} ${r.caminho} ${r.resumo} ${r.acesso}`).includes(integrarTexto(buscaRotas)));
  const resumo = carregando ? "Consultando os serviços…" : erro ? "Diagnóstico indisponível" : dados?.situacao === "ok" ? "Serviços responderam à consulta" : "Uma dependência precisa de atenção";
  return <div className="pagina-saude">
    <header className="saude-cabecalho"><Marca /><div><span className="saude-atalho"><kbd>Shift</kbd> + <kbd>S</kbd></span><Link className="botao" to="/">Voltar ao site</Link></div></header>
    <div className="saude-layout">
      <aside className="saude-indice"><p>Informações do sistema</p><nav aria-label="Seções do diagnóstico">{secoes.map(([id, nome]) => <a href={`#${id}`} key={id}>{nome}</a>)}</nav><p className="saude-nota">Documentação do código<br />e consulta em tempo real.</p></aside>
      <div className="saude-corpo">
        <section id="visao-geral" className="saude-abertura" aria-labelledby="titulo-saude">
          <div className="saude-titulo"><div><h1 id="titulo-saude">Por dentro do EloSocial</h1><p>Da interface ao banco de dados: serviços, deploys, rotas e o que cada parte da aplicação faz.</p></div><button className="botao escuro" disabled={carregando} onClick={() => definirTentativa((n) => n + 1)}>{carregando ? "Consultando…" : "Atualizar diagnóstico"}</button></div>
          <div className={`saude-resumo ${dados?.situacao === "ok" ? "disponivel" : ""}`} role="status"><strong>{resumo}</strong><span>{dados ? `Última consulta: ${dataHora(dados.verificadoEm)}` : "Sem atualização automática"}</span></div>
          {erro && <p className="saude-alerta" role="alert">{erro}</p>}
          <h2 className="somente-leitor-saude">Disponibilidade dos serviços</h2><div className="saude-servicos">
            {[
              ["Interface", "Página React carregada neste navegador", "ok"],
              ["API Next.js", "Resposta pelo encaminhamento /api da interface", dados?.servicos.api?.situacao],
              ["PostgreSQL", "Consulta pública de leitura via Supabase", dados?.servicos.banco?.situacao, dados?.servicos.banco?.duracaoMs],
              ["Supabase Auth", "Saúde do serviço de autenticação", dados?.servicos.autenticacao?.situacao, dados?.servicos.autenticacao?.duracaoMs],
            ].map(([nome, descricao, situacao, tempo], i) => <div className="saude-servico" key={nome}><div><h3>{nome}</h3><p>{descricao}</p></div><div>{tempo !== undefined && <small>{tempo} ms</small>}<Estado situacao={situacao} carregando={i > 0 && carregando} /></div></div>)}
          </div>
          <p className="saude-nota">Esta consulta verifica disponibilidade por leitura. Não testa aprovação, cadastro, permissões de cada conta ou entrega de e-mails. No plano gratuito do Render, a primeira consulta pode aguardar a inicialização do serviço.</p>
        </section>

        <section id="publicacoes" aria-labelledby="titulo-publicacoes"><h2 id="titulo-publicacoes">Onde a aplicação está publicada</h2><p className="saude-descricao">Dois serviços independentes no mesmo repositório. O banco e a autenticação permanecem no Supabase.</p>
          <div className="saude-deploys">
            <article><h3>Frontend <span>React + Vite</span></h3><dl>
              <div><dt>Endereço em uso</dt><dd><Endereco valor={window.location.origin} /></dd></div>
              <div><dt>Hospedagem do build</dt><dd>{build.plataforma}</dd></div>
              <div><dt>Versão</dt><dd>{build.versao} · React {build.react} · Vite {build.vite}</dd></div>
              <Versao commit={build.commit} ramo={build.ramo} />
              <div><dt>Compilação</dt><dd>{dataHora(build.compiladoEm)}</dd></div>
              <div><dt>Diretório</dt><dd><code>frontend/</code></dd></div>
            </dl></article>
            <article><h3>Backend <span>Next.js + Node.js</span></h3><dl>
              <div><dt>Endereço configurado</dt><dd><Endereco valor={dados?.publicacao.backend} /></dd></div>
              <div><dt>Hospedagem informada</dt><dd>{dados?.publicacao.plataforma || "Aguardando consulta"}</dd></div>
              <div><dt>Versão</dt><dd>{dados ? `${dados.publicacao.versao} · ${dados.publicacao.framework} · Node ${dados.publicacao.node}` : "Aguardando consulta"}</dd></div>
              <Versao commit={dados?.publicacao.commit} ramo={dados?.publicacao.ramo} />
              <div><dt>Ambiente</dt><dd>{dados?.publicacao.ambiente || "Aguardando consulta"}</dd></div>
              <div><dt>Diretório</dt><dd><code>backend/</code></dd></div>
            </dl></article>
          </div>
          <p className="saude-nota">A data acima é a compilação da interface, não o horário do último deploy do backend. Commit e branch aparecem somente quando fornecidos pelo ambiente de publicação.</p>
        </section>

        <section id="arquitetura" aria-labelledby="titulo-arquitetura"><h2 id="titulo-arquitetura">Como as partes se conectam</h2><p className="saude-descricao">A interface chama a API no próprio domínio. A Vercel encaminha essas chamadas ao Render, onde ficam as regras da aplicação.</p>
          <div className="saude-fluxo" aria-label="Navegador, frontend Vercel, API Render e Supabase"><div><strong>Navegador</strong><span>React · interface</span><code>frontend/</code></div><span className="saude-conector" aria-hidden="true">→</span><div><strong>Vercel</strong><span>Arquivos do site + rewrite</span><code>/api/*</code></div><span className="saude-conector" aria-hidden="true">→</span><div><strong>Render</strong><span>Next.js · regras e sessão</span><code>backend/</code></div><span className="saude-conector" aria-hidden="true">→</span><div><strong>Supabase</strong><span>PostgreSQL + Auth</span><code>Dados e identidade</code></div></div>
          <p className="saude-nota">As credenciais de acesso ao banco ficam no servidor. O mapa usa tiles do OpenStreetMap diretamente no navegador. Os e-mails de confirmação e recuperação são enviados pelo Supabase Auth.</p>
        </section>

        <section id="funcoes" aria-labelledby="titulo-funcoes"><div className="saude-titulo-secao"><h2 id="titulo-funcoes">Todas as funcionalidades</h2><span>{funcionalidades.length} funções catalogadas</span></div><p className="saude-descricao">Catálogo do que está implementado no código. A numeração identifica cada função; não representa uma nota de qualidade ou um teste aprovado.</p>
          <div className="saude-filtros"><label>Buscar função<input type="search" value={buscaFuncoes} onChange={(e) => definirBuscaFuncoes(e.target.value)} placeholder="Nome, tela ou endpoint" /></label><label>Área da aplicação<select aria-label="Área da aplicação" value={grupo} onChange={(e) => definirGrupo(e.target.value)}><option value="">Todas as áreas</option>{gruposFuncionais.map((g) => <option key={g}>{g}</option>)}</select></label></div>
          <p className="saude-contagem" role="status">{listaFuncoes.length} de {funcionalidades.length} funções</p>
          {gruposFuncionais.map((g) => { const itens = listaFuncoes.filter((f) => f.grupo === g); return itens.length ? <div className="saude-grupo" key={g}><h3>{g}</h3><ol>{itens.map((f) => <li key={f.numero} value={f.numero}><div><h4>{f.nome}</h4><p>{f.descricao}</p><div className="saude-referencias"><span className="saude-tipo">{f.tela ? "Interface" : "Somente API"}</span>{f.tela && <code>{f.tela}</code>}{f.rotas.map((rota) => <code key={rota}>{rota}</code>)}</div></div></li>)}</ol></div> : null; })}
          {!listaFuncoes.length && <p className="saude-vazio">Nenhuma função corresponde à busca. Altere o texto ou selecione outra área.</p>}
        </section>

        <section id="rotas" aria-labelledby="titulo-rotas"><div className="saude-titulo-secao"><h2 id="titulo-rotas">Rotas da API</h2><span>{inventario.length} operações</span></div><p className="saude-descricao">{dados ? "Inventário obtido da especificação OpenAPI do backend em execução." : "Referência local do código; o inventário da API aparecerá quando a consulta responder."} A tabela descreve as operações sem executá-las.</p>
          <div className="saude-filtros"><label>Buscar rota<input type="search" value={buscaRotas} onChange={(e) => definirBuscaRotas(e.target.value)} placeholder="Caminho, operação ou acesso" /></label><label>Método<select aria-label="Método" value={metodo} onChange={(e) => definirMetodo(e.target.value)}><option value="">Todos os métodos</option>{["GET", "POST", "PATCH", "DELETE"].map((m) => <option key={m}>{m}</option>)}</select></label></div>
          <p className="saude-contagem" role="status">{listaRotas.length} de {inventario.length} operações</p>
          <div className="saude-tabela" tabIndex={0} role="region" aria-label="Operações HTTP, com rolagem horizontal em telas pequenas"><table><caption className="somente-leitor-saude">Método, caminho, descrição e acesso das operações da API</caption><thead><tr><th>Método e rota</th><th>Operação</th><th>Acesso</th></tr></thead><tbody>{listaRotas.map((r) => <tr key={`${r.metodo} ${r.caminho}`}><td><span className={`saude-metodo metodo-${r.metodo.toLowerCase()}`}>{r.metodo}</span><code>{r.caminho}</code></td><td>{r.resumo}</td><td>{r.acesso}</td></tr>)}</tbody></table>{!listaRotas.length && <p className="saude-vazio">Nenhuma rota corresponde aos filtros.</p>}</div>
          <p className="saude-nota">“Público” indica ausência de cookie obrigatório no contrato. Confirmação e recuperação ainda exigem um código ou token válido. Os acessos protegidos são validados pelo servidor.</p>
          <div className="saude-links"><a href="/api/openapi" target="_blank" rel="noreferrer">Abrir contrato OpenAPI ↗</a>{dados?.publicacao.backend && <a href={`${dados.publicacao.backend}/docs`} target="_blank" rel="noreferrer">Abrir Swagger no backend ↗</a>}</div>
        </section>

        <section id="integracoes" aria-labelledby="titulo-integracoes"><h2 id="titulo-integracoes">APIs e recursos externos</h2><p className="saude-descricao">Integrações de execução e recursos auxiliares têm papéis diferentes. Apenas banco e saúde do Auth são sondados nesta página.</p><dl className="saude-integracoes">{integracoes.map(([nome, tipo, descricao, url]) => <div key={nome}><dt><a href={url} target="_blank" rel="noreferrer">{nome} ↗</a><span>{tipo}</span></dt><dd>{descricao}</dd></div>)}</dl></section>

        <section id="banco" aria-labelledby="titulo-banco"><h2 id="titulo-banco">Banco de dados e segurança</h2><p className="saude-descricao">PostgreSQL gerenciado pelo Supabase. Este painel documenta a estrutura, sem consultar ou exibir os registros privados.</p><div className="saude-projeto"><span>Projeto informado pela API</span><Endereco valor={dados?.banco.projeto} /></div>
          <dl className="saude-tabelas">{tabelas.map(([nome, descricao]) => <div key={nome}><dt><code>{nome}</code></dt><dd>{descricao}</dd></div>)}</dl>
          <h3 className="saude-subtitulo">Proteções implementadas</h3><ul className="saude-seguranca"><li>Sessão verificada no servidor pelo Supabase Auth; cookies HttpOnly, Secure em produção e SameSite=Lax.</li><li>Controle de perfil e vínculo na API; políticas RLS e gatilhos no banco restringem acesso e alterações dos dados.</li><li>Validação com Zod, rejeição de campos extras e limite de 20 KB para corpos JSON.</li><li>Verificação da origem das requisições que alteram dados.</li><li>Chave administrativa somente no backend; respostas de erro não publicam detalhes internos.</li><li>Confirmação de e-mail e recuperação de senha exclusivamente pelo Supabase Auth.</li></ul>
          <p className="saude-nota">Este resumo descreve mecanismos do código e do esquema versionado. A consulta de saúde não audita permissões, políticas RLS ou segurança de ponta a ponta.</p>
        </section>
        <footer className="saude-rodape"><span>EloSocial · documentação operacional</span><Link to="/">Voltar ao mapa</Link></footer>
      </div>
    </div>
  </div>;
}
