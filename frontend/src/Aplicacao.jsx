import { useEffect, useState } from "react";
import { Link, NavLink, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { api } from "./api";
import RedefinirSenha from "./paginas/RedefinirSenha";
import CadastroOng from "./paginas/CadastroOng";
import { Marca, Introducao } from "./componentes/Comum";
import { Descobrir, Perfil } from "./paginas/Descobrir";
import { Entrar, CriarConta, RecuperarSenha } from "./paginas/Autenticacao";
import PainelGestor from "./paginas/PainelGestor";
import ConfirmarEmail from "./paginas/ConfirmarEmail";
import Administracao from "./paginas/Administracao";

// Esta estrutura reúne o cabeçalho, o rodapé e as rotas da interface.
export default function Aplicacao() {
  const localizacao = useLocation();
  const navegar = useNavigate();
  const [papelDaConta, definirPapelDaConta] = useState(null);
  const mostrarCadastro =
    papelDaConta !== "admin" && localizacao.pathname !== "/admin";
  useEffect(() => {
    if (localizacao.pathname !== "/") return;
    const fragmento = new URLSearchParams(window.location.hash.slice(1));
    if (!fragmento.has("access_token") || !fragmento.has("refresh_token"))
      return;
    navegar(
      {
        pathname:
          fragmento.get("type") === "recovery"
            ? "/redefinir-senha"
            : "/confirmar-email",
        hash: window.location.hash,
      },
      { replace: true },
    );
  }, [localizacao.pathname, navegar]);
  useEffect(() => {
    let ativo = true;
    api("/auth/me")
      .then((conta) => {
        if (ativo) definirPapelDaConta(conta.papel);
      })
      .catch(() => {
        if (ativo) definirPapelDaConta(null);
      });
    return () => {
      ativo = false;
    };
  }, [localizacao.pathname]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [localizacao.pathname]);
  return (
    <>
      <a className="atalho-conteudo" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className="cabecalho">
        <div className="conteudo-cabecalho">
          <Marca />
          <nav aria-label="Navegação principal">
            <NavLink to="/" end>
              Mapa
            </NavLink>
            <NavLink to="/catalogo">Catálogo</NavLink>
            {mostrarCadastro && <NavLink to="/solicitar">Cadastrar ONG</NavLink>}
          </nav>
          <Link
            className="botao escuro pequeno"
            to={
              papelDaConta === "admin"
                ? "/admin"
                : papelDaConta
                  ? "/painel"
                  : "/entrar"
            }
          >
            {papelDaConta === "admin"
              ? "Administração"
              : papelDaConta
                ? "Meu painel"
                : "Área da ONG"}{" "}
            <span>↗</span>
          </Link>
        </div>
      </header>
      <main id="conteudo">
        <Routes>
          <Route path="/" element={<Descobrir mapa />} />
          <Route path="/catalogo" element={<Descobrir />} />
          <Route path="/ongs/:id" element={<Perfil />} />
          <Route path="/solicitar" element={<CadastroOng />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/criar-conta" element={<CriarConta />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/confirmar-email" element={<ConfirmarEmail />} />
          <Route path="/painel/*" element={<PainelGestor />} />
          <Route path="/admin" element={<Administracao />} />
          <Route
            path="*"
            element={
              <div className="conteudo">
                <Introducao
                  sobretitulo="404"
                  titulo="Essa página não foi encontrada."
                />

                <Link className="botao escuro" to="/">
                  Voltar ao mapa
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer>
        <div className="conteudo-rodape">
          <Marca />
          <p>Catálogo de ONGs e projetos sociais de Fortaleza.</p>
          {mostrarCadastro && (
            <Link to="/solicitar">Solicitar inclusão de ONG ↗</Link>
          )}
        </div>
        <div className="rodape-inferior">
          <span>© {new Date().getFullYear()} EloSocial</span>
          <span>Projeto acadêmico · UNIFOR</span>
        </div>
      </footer>
    </>
  );
}
