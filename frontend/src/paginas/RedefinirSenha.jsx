import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function RedefinirSenha() {
  const iniciado = useRef(false);
  const [situacao, definirSituacao] = useState("verificando");
  const [senha, definirSenha] = useState("");
  const [confirmarSenha, definirConfirmarSenha] = useState("");
  const [erro, definirErro] = useState("");
  const [errosDosCampos, definirErrosDosCampos] = useState({});

  useEffect(() => {
    // O endereço é de uso único. A referência evita uma segunda troca no modo estrito do React.
    if (iniciado.current) return;
    iniciado.current = true;
    const parametros = new URLSearchParams(window.location.search);
    const codigo = parametros.get("code");
    const fragmento = new URLSearchParams(window.location.hash.slice(1));
    const tokenAcesso = fragmento.get("access_token");
    const tokenRenovacao = fragmento.get("refresh_token");
    const falhou = parametros.has("error") || fragmento.has("error");
    window.history.replaceState(null, "", window.location.pathname);
    const dados = codigo
      ? { codigo }
      : tokenAcesso && tokenRenovacao
        ? { tokenAcesso, tokenRenovacao }
        : null;
    if (!dados || falhou) {
      definirErro(
        "Esse endereço é inválido ou expirou. Solicite um novo e abra no mesmo navegador.",
      );
      definirSituacao("invalido");
      return;
    }
    api("/auth/confirmar-recuperacao", { method: "POST", body: dados })
      .then(() => definirSituacao("pronto"))
      .catch((e) => {
        definirErro(e.message);
        definirSituacao("invalido");
      });
  }, []);

  async function salvar(e) {
    e.preventDefault();
    definirErro("");
    const erros = {};
    if (
      senha.length < 8 ||
      senha.length > 72 ||
      !/[A-Za-z]/.test(senha) ||
      !/\d/.test(senha)
    ) {
      erros.senha =
        "Use de 8 a 72 caracteres, incluindo uma letra e um número.";
    }
    if (senha !== confirmarSenha)
      erros.confirmarSenha = "As senhas precisam ser iguais.";
    definirErrosDosCampos(erros);
    if (Object.keys(erros).length) return;
    definirSituacao("salvando");
    try {
      await api("/auth/redefinir-senha", { method: "POST", body: { senha } });
      definirSenha("");
      definirConfirmarSenha("");
      definirSituacao("sucesso");
    } catch (e) {
      definirErro(e.message);
      definirErrosDosCampos(e.fields || {});
      definirSituacao(e.status === 401 ? "invalido" : "pronto");
    }
  }

  return (
    <div className="conteudo estreito">
      <div className="introducao">
        <span className="sobretitulo">SEGURANÇA DO ACESSO</span>
        <h1>
          {situacao === "sucesso"
            ? "Senha atualizada."
            : "Defina sua nova senha"}
        </h1>
        <p>
          {situacao === "sucesso"
            ? "Seu acesso está pronto. Entre novamente com a nova senha."
            : "Escolha uma senha para voltar a acessar a área da ONG."}
        </p>
      </div>
      {situacao === "verificando" ? (
        <div className="carregando" role="status">
          <span className="indicador-carregamento" />
          Verificando o endereço…
        </div>
      ) : situacao === "sucesso" ? (
        <div className="cartao-formulario">
          <div className="aviso sucesso" role="status">
            Sua senha foi alterada com sucesso.
          </div>
          <Link className="botao escuro largura-total" to="/entrar">
            Ir para a entrada →
          </Link>
        </div>
      ) : situacao === "invalido" ? (
        <div className="cartao-formulario">
          <div className="aviso" role="alert">
            {erro}
          </div>
          <Link className="botao escuro largura-total" to="/recuperar-senha">
            Solicitar outro endereço
          </Link>
          <Link className="voltar" to="/entrar">
            ← Voltar para a entrada
          </Link>
        </div>
      ) : (
        <form className="cartao-formulario" onSubmit={salvar}>
          {erro && (
            <div className="aviso" role="alert">
              {erro}
            </div>
          )}
          <label className="campo" htmlFor="nova-senha">
            Nova senha *
            <input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={senha}
              onChange={(e) => definirSenha(e.target.value)}
              aria-invalid={Boolean(errosDosCampos.senha)}
              aria-describedby="senha-ajuda senha-erro"
            />
            {errosDosCampos.senha && (
              <span className="erro-campo" id="senha-erro">
                {errosDosCampos.senha}
              </span>
            )}
          </label>
          <label className="campo" htmlFor="confirmar-nova-senha">
            Confirmar nova senha *
            <input
              id="confirmar-nova-senha"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={confirmarSenha}
              onChange={(e) => definirConfirmarSenha(e.target.value)}
              aria-invalid={Boolean(errosDosCampos.confirmarSenha)}
              aria-describedby={
                errosDosCampos.confirmarSenha ? "confirmacao-erro" : undefined
              }
            />
            {errosDosCampos.confirmarSenha && (
              <span className="erro-campo" id="confirmacao-erro">
                {errosDosCampos.confirmarSenha}
              </span>
            )}
          </label>
          <p className="dica" id="senha-ajuda">
            Use de 8 a 72 caracteres, incluindo letras e números.
          </p>
          <button
            className="botao escuro largura-total"
            disabled={situacao === "salvando"}
          >
            {situacao === "salvando" ? "Salvando…" : "Salvar nova senha →"}
          </button>
        </form>
      )}
    </div>
  );
}
