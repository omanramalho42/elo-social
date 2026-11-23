import { useEffect, useState } from "react";
import { projetarDemanda, validarRelatorioCarga } from "../utilitarios/desempenho";
import "./Desempenho.css";

const numero = (valor, casas = 0) => valor === null || valor === undefined ? "—" : valor.toLocaleString("pt-BR", { maximumFractionDigits: casas });
const percentual = (valor) => valor === null || valor === undefined ? "Sem amostra" : `${numero(valor * 100, 1)}%`;
const milissegundos = (valor) => valor === null || valor === undefined ? "Sem amostra" : `${numero(valor, 1)} ms`;
function faixa(amostra, metrica) {
  if (!amostra || !amostra.total) return "vazia";
  if (metrica === "erros") return amostra.taxaErro > .05 ? "critica" : amostra.taxaErro > 0 ? "atencao" : "boa";
  return amostra.p95Ms > 1000 ? "critica" : amostra.p95Ms > 200 ? "atencao" : "boa";
}

export default function Desempenho() {
  const [relatorio, definirRelatorio] = useState(null);
  const [erro, definirErro] = useState("");
  const [tentativa, definirTentativa] = useState(0);
  const [carregando, definirCarregando] = useState(true);
  const [metrica, definirMetrica] = useState("p95");
  const [selecao, definirSelecao] = useState(null);
  const [usuarios, definirUsuarios] = useState("50000000");
  const [chamadas, definirChamadas] = useState("1");
  const [intervalo, definirIntervalo] = useState(30);
  useEffect(() => {
    const controlador = new AbortController();
    let ativo = true;
    const prazo = setTimeout(() => controlador.abort(), 10000);
    definirCarregando(true); definirErro("");
    fetch("/diagnosticos/carga.json", { cache: "no-cache", credentials: "omit", signal: controlador.signal })
      .then(async (resposta) => {
        if (!resposta.ok) throw new Error();
        const dados = await resposta.json();
        if (!validarRelatorioCarga(dados)) throw new Error();
        if (ativo) { definirRelatorio(dados); definirSelecao(null); }
      })
      .catch(() => { if (ativo) definirErro("Não foi possível carregar o relatório. Tente atualizar. Nenhum resultado foi estimado para preencher o mapa."); })
      .finally(() => { clearTimeout(prazo); if (ativo) definirCarregando(false); });
    return () => { ativo = false; clearTimeout(prazo); controlador.abort(); };
  }, [tentativa]);
  const demanda = projetarDemanda(Number(usuarios), Number(chamadas), Number(intervalo));
  const etapasSemErro = relatorio?.etapas.filter((e) => e.resumo.erros === 0) || [];
  const maiorVazao = etapasSemErro.length ? Math.max(...etapasSemErro.map((e) => e.resumo.sucessosPorSegundo)) : null;
  const ultimaEtapa = relatorio?.etapas.at(-1);
  const total = relatorio?.etapas.reduce((soma, e) => soma + e.resumo.total, 0);
  const detalhe = selecao && relatorio?.etapas.find((e) => e.concorrencia === selecao.concorrencia)?.rotas.find((r) => r.rota === selecao.rota);
  return <div className="carga-corpo">
    <div className="saude-titulo carga-titulo"><div><h1>Como a API responde sob carga</h1><p>Resultados de um ensaio controlado, com concorrência crescente e chamadas reais ao código da API.</p></div><button className="botao" disabled={carregando} onClick={() => definirTentativa((n) => n + 1)}>{carregando ? "Carregando relatório…" : "Atualizar relatório"}</button></div>
    <div className="carga-contexto"><strong>Ensaio local com banco simulado. A produção não recebeu carga.</strong><p>API Next.js, gerador e simulador compartilham a mesma máquina. Estes resultados não comprovam suporte a 50 milhões de usuários nem determinam o limite da hospedagem atual.</p></div>
    {erro && <p className="saude-alerta" role="alert">{erro}</p>}
    {carregando && !relatorio && <p role="status" className="saude-nota">Lendo o relatório agregado do último ensaio…</p>}
    {relatorio && <>
      <div className="carga-identificacao"><span>Executado em {new Date(relatorio.geradoEm).toLocaleString("pt-BR")}</span><a href="/diagnosticos/carga.json" download="elosocial-ensaio-carga.json">Baixar resultados JSON</a></div>
      <dl className="carga-medidas">
        <div><dt>Maior concorrência ensaiada</dt><dd>{numero(ultimaEtapa.concorrencia)} <span>clientes HTTP</span></dd></div>
        <div><dt>Maior vazão observada sem erro na etapa</dt><dd>{numero(maiorVazao, 1)} <span>chamadas/s</span></dd></div>
        <div><dt>Chamadas medidas no ensaio</dt><dd>{numero(total)} <span>somente leitura</span></dd></div>
      </dl>
      <p className="carga-conclusao"><strong>Condição de encerramento:</strong> {relatorio.encerramento} Na última etapa: P95 de {milissegundos(ultimaEtapa.resumo.p95Ms)} e {percentual(ultimaEtapa.resumo.taxaErro)} de erros ({numero(ultimaEtapa.causas.conexaoOuTimeout)} de conexão/timeout e {numero(ultimaEtapa.causas.http)} respostas HTTP de erro). Esses erros não identificam, sozinhos, qual processo saturou.</p>
      <section className="carga-secao" aria-labelledby="titulo-calor">
        <div className="carga-cabecalho-secao"><div><h2 id="titulo-calor">Mapa de calor por concorrência e rota</h2><p>Selecione uma célula para consultar suas medições. Não é um mapa geográfico de usuários.</p></div><label>Medida<select aria-label="Medida do mapa de calor" value={metrica} onChange={(e) => definirMetrica(e.target.value)}><option value="p95">Latência P95</option><option value="erros">Taxa de erro</option></select></label></div>
        <div className="carga-legenda" aria-label="Legenda das faixas"><span className="boa">{metrica === "p95" ? "Até 200 ms" : "Sem erro"}</span><span className="atencao">{metrica === "p95" ? "200 a 1.000 ms" : "Até 5% de erro"}</span><span className="critica">{metrica === "p95" ? "Acima de 1.000 ms" : "Acima de 5% de erro"}</span></div>
        <div className="carga-mapa" role="region" tabIndex={0} aria-label="Mapa de calor, com rolagem horizontal em telas pequenas"><table><caption>Concorrência em clientes HTTP × operações GET · {metrica === "p95" ? "latência P95" : "taxa de erro"}</caption><thead><tr><th scope="col">Clientes HTTP</th>{relatorio.rotas.map((rota) => <th scope="col" key={rota}><code>GET {rota}</code></th>)}</tr></thead><tbody>{relatorio.etapas.map((etapa) => <tr key={etapa.concorrencia}><th scope="row">{numero(etapa.concorrencia)}</th>{relatorio.rotas.map((rota) => {
          const amostra = etapa.rotas.find((r) => r.rota === rota);
          const selecionada = selecao?.concorrencia === etapa.concorrencia && selecao?.rota === rota;
          return <td key={rota}><button type="button" className={`carga-celula ${faixa(amostra, metrica)}`} aria-pressed={selecionada} aria-label={`${etapa.concorrencia} clientes, GET ${rota}, ${metrica === "p95" ? `P95 ${milissegundos(amostra?.p95Ms)}` : `${percentual(amostra?.taxaErro)} de erro`}`} onClick={() => definirSelecao({ concorrencia: etapa.concorrencia, rota })}><strong>{metrica === "p95" ? milissegundos(amostra?.p95Ms) : percentual(amostra?.taxaErro)}</strong><small>{numero(amostra?.total)} chamadas</small></button></td>;
        })}</tr>)}</tbody></table></div>
        <p className="saude-nota">P95 é o tempo em que 95% das chamadas concluíram, incluindo falhas e timeouts. As cores usam faixas de comparação, não um SLA contratado. Níveis não executados não aparecem como resultados.</p>
        <div className="carga-detalhe" aria-live="polite">{detalhe ? <><h3>{numero(selecao.concorrencia)} clientes · <code>GET {detalhe.rota}</code></h3><dl><div><dt>P50</dt><dd>{milissegundos(detalhe.p50Ms)}</dd></div><div><dt>P95</dt><dd>{milissegundos(detalhe.p95Ms)}</dd></div><div><dt>P99</dt><dd>{milissegundos(detalhe.p99Ms)}</dd></div><div><dt>Sucessos</dt><dd>{numero(detalhe.sucessos)}/{numero(detalhe.total)}</dd></div><div><dt>Erros</dt><dd>{percentual(detalhe.taxaErro)}</dd></div><div><dt>Vazão da rota</dt><dd>{numero(detalhe.sucessosPorSegundo, 1)} req/s</dd></div></dl></> : <p>Selecione uma célula para ver P50, P95, P99, sucessos e erros.</p>}</div>
      </section>
    </>}
    <section className="carga-secao" aria-labelledby="titulo-projecao"><h2 id="titulo-projecao">E se fossem 50 milhões ou mais?</h2><p className="saude-descricao">Projeção matemática de demanda. Usuários simultâneos não equivalem a chamadas simultâneas: a frequência e as ações de cada pessoa mudam o volume.</p>
      <div className="carga-entradas"><label>Usuários ativos<input type="number" min="1" max="1000000000" step="1" value={usuarios} onChange={(e) => definirUsuarios(e.target.value)} /></label><label>Chamadas à API por ciclo<input type="number" min="1" max="100" step="1" value={chamadas} onChange={(e) => definirChamadas(e.target.value)} /></label><label>Intervalo entre ciclos<select value={intervalo} onChange={(e) => definirIntervalo(Number(e.target.value))} aria-label="Intervalo entre ciclos">{[1, 5, 10, 30, 60, 120].map((n) => <option key={n} value={n}>{n} segundo{n === 1 ? "" : "s"}</option>)}</select></label></div>
      <div className="carga-projecao" role="status">{demanda === null ? <p>Informe de 1 a 1 bilhão de usuários e de 1 a 100 chamadas por ciclo.</p> : <><span>Demanda projetada · não executada</span><strong>{numero(demanda)} <small>chamadas por segundo</small></strong><p>{numero(Number(usuarios))} usuários × {numero(Number(chamadas))} chamada(s) ÷ {intervalo} segundos.</p>{maiorVazao > 0 && <p>O volume seria cerca de <b>{numero(demanda / maiorVazao, 1)} vezes</b> a maior vazão bem-sucedida observada neste ensaio local. Essa razão não é uma estimativa de servidores necessários nem uma previsão de escala linear.</p>}</>}</div>
      <p className="saude-nota">Para comprovar esse volume seriam necessários geradores distribuídos e um ambiente de carga dimensionado, com a infraestrutura e o banco reais isolados para o ensaio. Esta página não contrata recursos nem inicia testes contra o site.</p>
    </section>
    {relatorio && <section className="carga-secao" aria-labelledby="titulo-metodologia"><h2 id="titulo-metodologia">Como o ensaio foi executado</h2><dl className="saude-tabelas"><div><dt>API</dt><dd>Next.js {relatorio.ambiente.next} em modo de produção, somente loopback.</dd></div><div><dt>Dependência</dt><dd>{relatorio.ambiente.banco}, atraso configurado de {relatorio.ambiente.atrasoBancoMs} ms e {relatorio.ambiente.registrosSinteticos} ONGs sintéticas.</dd></div><div><dt>Máquina</dt><dd>{relatorio.ambiente.processadoresLogicos} processadores lógicos e {relatorio.ambiente.memoriaTotalGiB} GiB de RAM. Gerador, API e banco simulado no mesmo computador.</dd></div><div><dt>Janela</dt><dd>{relatorio.metodologia.janelaPorEtapaMs / 1000} segundos de lançamento por nível, mais drenagem; timeout configurado de {relatorio.metodologia.timeoutMs / 1000} segundos. Sob bloqueio do gerador, o tempo observado pode ultrapassar o timeout.</dd></div><div><dt>Modelo</dt><dd>{relatorio.metodologia.modelo}</dd></div><div><dt>Código base</dt><dd><code>{relatorio.commitBase?.slice(0, 12) || "Não informado"}</code> · Node {relatorio.ambiente.node}</dd></div></dl><h3 className="saude-subtitulo">Limites da interpretação</h3><ul className="saude-seguranca">{relatorio.limitacoes.map((limite) => <li key={limite}>{limite}</li>)}</ul><p className="saude-nota">Para repetir no ambiente local, após compilar o backend: <code>npm.cmd run testar:carga</code>. A rotina não aceita um alvo externo e encerra seus próprios processos ao finalizar.</p></section>}
  </div>;
}
