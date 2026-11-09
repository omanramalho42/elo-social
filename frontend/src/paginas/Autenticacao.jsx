import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { Campo, Introducao, Aviso } from "../componentes/Comum";

export function Entrar() {
  const [errosDosCampos, definirErrosDosCampos] = useState({});
  const [valoresDoFormulario, definirValoresDoFormulario] = useState({
      email: "",
      senha: "",
    }),
    [ocupado, definirOcupado] = useState(false),
    [erro, definirErro] = useState("");
  const navegar = useNavigate();
  async function enviar(e) {
    e.preventDefault();
    definirOcupado(true);
    definirErro("");
    definirErrosDosCampos({});
    try {
      await api("/auth/login", { method: "POST", body: valoresDoFormulario });
      const conta = await api("/auth/me");
      const proximo = new URLSearchParams(window.location.search).get("proximo");
      navegar(
        conta.papel === "admin"
          ? "/admin"
          : proximo === "/solicitar"
            ? "/solicitar"
            : "/painel",
      );
    } catch (e) {
      definirErro(e.message);
      definirErrosDosCampos(e.fields || {});
    } finally {
      definirOcupado(false);
    }
  }
  return (
    <div className="conteudo estrutura-acesso">
      <div className="mensagem-acesso">
        <span className="sobretitulo">ÁREA DA ONG</span>
        <h1>
          Área da ONG.
          <br />
          <span>Gerencie suas informações.</span>
        </h1>
        <p>
          Atualize as informações da sua instituição e mantenha seus projetos
          perto de quem quer ajudar.
        </p>
        <div className="arte-acesso" aria-hidden="true">
          ↗
          <span>
            ONGs.
            <br />
            Projetos e dados.
          </span>
        </div>
      </div>
      <form className="cartao-acesso" onSubmit={enviar}>
        <span className="sobretitulo">BEM-VINDO DE VOLTA</span>
        <h2>Entrar como gestor</h2>
        <p>Use o acesso vinculado à sua instituição.</p>
        <Aviso>{erro}</Aviso>
        <Campo
          erros={errosDosCampos}
          rotulo="E-mail"
          nome="email"
          tipo="email"
          valores={valoresDoFormulario}
          definirValores={definirValoresDoFormulario}
          autoComplete="username"
        />

        <Campo
          erros={errosDosCampos}
          rotulo="Senha"
          nome="senha"
          tipo="password"
          valores={valoresDoFormulario}
          definirValores={definirValoresDoFormulario}
          autoComplete="current-password"
        />

        <Link className="esqueci" to="/recuperar-senha">
          Esqueci minha senha
        </Link>
        <button className="botao escuro largura-total" disabled={ocupado}>
          {ocupado ? "Entrando…" : "Entrar →"}
        </button>
        <p className="rodape-acesso">
          Ainda não tem conta? <Link to="/criar-conta">Criar acesso</Link>
        </p>
        <p className="dica">
          Cadastre sua ONG após entrar. O painel de edição será liberado após a
          aprovação pela equipe.
        </p>
      </form>
    </div>
  );
}
export function CriarConta() {
  const navegar = useNavigate();
  const [errosDosCampos, definirErrosDosCampos] = useState({});
  const [valoresDoFormulario, definirValoresDoFormulario] = useState({
      nome: "",
      email: "",
      telefone: "",
      senha: "",
      confirmarSenha: "",
    }),
    [erro, definirErro] = useState(""),
    [sucesso, definirSucesso] = useState(""),
    [ocupado, definirOcupado] = useState(false);
  async function enviar(e) {
    e.preventDefault();
    if (valoresDoFormulario.senha !== valoresDoFormulario.confirmarSenha) {
      definirErro("As senhas precisam ser iguais.");
      return;
    }
    definirOcupado(true);
    definirErro("");
    definirErrosDosCampos({});
    try {
      const d = await api("/auth/registrar", {
        method: "POST",
        body: valoresDoFormulario,
      });
      definirSucesso(d.mensagem);
      navegar("/painel?cadastro=pendente", { replace: true });
    } catch (e) {
      definirErro(e.message);
      definirErrosDosCampos(e.fields || {});
    } finally {
      definirOcupado(false);
    }
  }
  return (
    <div className="conteudo estreito">
      <Introducao
        sobretitulo="ÁREA DA ONG"
        titulo="Crie seu acesso"
        texto="Confirme seu e-mail e entre na conta para cadastrar sua instituição."
      />

      <form className="cartao-formulario" onSubmit={enviar}>
        <Aviso>{erro}</Aviso>
        <Aviso sucesso>{sucesso}</Aviso>
        {!sucesso && (
          <>
            <Campo
              erros={errosDosCampos}
              rotulo="Nome completo"
              nome="nome"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
              minLength={3}
            />

            <Campo
              erros={errosDosCampos}
              rotulo="E-mail"
              nome="email"
              tipo="email"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
            />

            <Campo
              erros={errosDosCampos}
              rotulo="Telefone com DDD"
              nome="telefone"
              tipo="tel"
              inputMode="numeric"
              maxLength={15}
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
            />

            <Campo
              erros={errosDosCampos}
              rotulo="Senha"
              nome="senha"
              tipo="password"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
              minLength={8}
            />

            <Campo
              erros={errosDosCampos}
              rotulo="Confirmar senha"
              nome="confirmarSenha"
              tipo="password"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
              minLength={8}
            />

            <p className="dica">
              Use ao menos oito caracteres, incluindo letras e números.
            </p>
            <button className="botao escuro largura-total" disabled={ocupado}>
              {ocupado ? "Criando…" : "Criar conta →"}
            </button>
          </>
        )}
        <Link className="voltar" to="/entrar">
          ← Voltar para a página de entrada
        </Link>
      </form>
    </div>
  );
}
export function RecuperarSenha() {
  const [errosDosCampos, definirErrosDosCampos] = useState({});
  const [valoresDoFormulario, definirValoresDoFormulario] = useState({
      email: "",
    }),
    [erro, definirErro] = useState(""),
    [mensagem, definirMensagem] = useState(""),
    [ocupado, definirOcupado] = useState(false);
  return (
    <div className="conteudo estreito">
      <Introducao
        sobretitulo="ACESSO"
        titulo="Recuperar senha"
        texto="Informe o e-mail usado no seu cadastro."
      />

      <form
        className="cartao-formulario"
        onSubmit={async (e) => {
          e.preventDefault();
          definirOcupado(true);
          definirErro("");
          definirErrosDosCampos({});
          try {
            const d = await api("/auth/recuperar-senha", {
              method: "POST",
              body: valoresDoFormulario,
            });
            definirMensagem(
              d.mensagem ||
                "Se o e-mail estiver cadastrado, você receberá as instruções.",
            );
          } catch (e) {
            definirErro(e.message);
            definirErrosDosCampos(e.fields || {});
          } finally {
            definirOcupado(false);
          }
        }}
      >
        <Aviso>{erro}</Aviso>
        <Aviso sucesso>{mensagem}</Aviso>
        <Campo
          erros={errosDosCampos}
          rotulo="E-mail"
          nome="email"
          tipo="email"
          valores={valoresDoFormulario}
          definirValores={definirValoresDoFormulario}
        />

        <button className="botao escuro largura-total" disabled={ocupado}>
          {ocupado ? "Enviando…" : "Enviar instruções"}
        </button>
        <p className="dica">
          Confira também a pasta de spam. Solicite e abra o endereço neste mesmo
          navegador.
        </p>
        <Link className="voltar" to="/entrar">
          ← Voltar para a página de entrada
        </Link>
      </form>
    </div>
  );
}
