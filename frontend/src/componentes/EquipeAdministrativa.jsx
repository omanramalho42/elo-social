import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function EquipeAdministrativa() {
  const [equipe, definirEquipe] = useState(null);
  const [email, definirEmail] = useState("");
  const [confirmar, definirConfirmar] = useState(false);
  const [ocupado, definirOcupado] = useState(false);
  const [erro, definirErro] = useState("");
  const [mensagem, definirMensagem] = useState("");
  useEffect(() => {
    let ativo = true;
    api("/admin/administradores").then((dados) => { if (ativo) definirEquipe(dados); }).catch((e) => { if (ativo) definirErro(e.message); });
    return () => { ativo = false; };
  }, []);
  async function adicionar(evento) {
    evento.preventDefault(); if (ocupado) return;
    definirOcupado(true); definirErro(""); definirMensagem("");
    try {
      const resposta = await api("/admin/administradores", { method: "POST", body: { email: email.trim(), confirmar } });
      definirEmail(""); definirConfirmar(false); definirMensagem(resposta.mensagem);
      try { definirEquipe(await api("/admin/administradores")); }
      catch { definirErro("O acesso foi concedido, mas a lista não atualizou. Recarregue a página."); }
    } catch (e) { definirErro(e.message); }
    finally { definirOcupado(false); }
  }
  return <section className="cartao-formulario" aria-labelledby="titulo-equipe">
    <h2 id="titulo-equipe">Administradores da equipe</h2>
    <p className="dica">Novos membros devem <Link to="/criar-conta">criar seu próprio acesso</Link> e confirmar o e-mail, sem cadastrar uma ONG. Depois, um administrador concede o acesso aqui.</p>
    {erro && <div className="aviso" role="alert">{erro}</div>}
    {mensagem && <div className="aviso sucesso" role="status">{mensagem}</div>}
    <form onSubmit={adicionar} style={{ maxWidth: 620 }}>
      <h3>Novo administrador</h3>
      <label className="campo">E-mail da conta confirmada *<input type="email" required maxLength={254} value={email} disabled={ocupado} onChange={(e) => { definirEmail(e.target.value); definirConfirmar(false); }} autoComplete="off" /></label>
      <label className="confirmacao-equipe"><input type="checkbox" checked={confirmar} disabled={ocupado} onChange={(e) => definirConfirmar(e.target.checked)} />Confirmo que esta pessoa está autorizada a aprovar ou rejeitar ONGs e adicionar outros administradores.</label>
      <button type="submit" className="botao escuro" disabled={ocupado || !confirmar || !email.trim()}>{ocupado ? "Adicionando…" : "Adicionar administrador"}</button>
    </form>
    <h3 style={{ marginTop: 32 }}>Equipe atual</h3>
    {equipe ? <ul className="lista-equipe">{equipe.map((pessoa) => <li key={pessoa.user_id}><strong>{pessoa.nome || "Administrador"}</strong><span>{pessoa.email}</span></li>)}</ul> : <p className="dica">{erro ? "Lista indisponível. Recarregue para tentar novamente." : "Carregando equipe…"}</p>}
  </section>;
}
