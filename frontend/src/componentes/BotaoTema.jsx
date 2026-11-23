import { useEffect, useState } from "react";

const chaveTema = "elosocial-tema";
function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tema === "escuro" ? "#151c18" : "#fafbf8");
}

export default function BotaoTema() {
  const [escuro, definirEscuro] = useState(() => document.documentElement.dataset.tema === "escuro");
  useEffect(() => {
    function sincronizar(evento) {
      if (evento.key !== chaveTema && evento.key !== null) return;
      const tema = evento.newValue === "escuro" ? "escuro" : "claro";
      aplicarTema(tema);
      definirEscuro(tema === "escuro");
    }
    window.addEventListener("storage", sincronizar);
    return () => window.removeEventListener("storage", sincronizar);
  }, []);
  function alternar() {
    const tema = escuro ? "claro" : "escuro";
    aplicarTema(tema);
    definirEscuro(!escuro);
    try { localStorage.setItem(chaveTema, tema); }
    catch { /* A troca continua funcionando quando o navegador bloqueia armazenamento. */ }
  }
  const acao = escuro ? "Ativar modo claro" : "Ativar modo escuro";
  return <button type="button" className="botao botao-tema" onClick={alternar} aria-label={acao} title={acao}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {escuro ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></> : <path d="M20.6 13A8.6 8.6 0 0 1 11 3.4a8.6 8.6 0 1 0 9.6 9.6Z" />}
    </svg>
    <span className="rotulo-tema">{escuro ? "Modo claro" : "Modo escuro"}</span>
  </button>;
}
