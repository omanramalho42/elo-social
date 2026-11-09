import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function ConfirmarEmail() {
  const iniciado = useRef(false);
  const navegar = useNavigate();
  const [erro, definirErro] = useState("");

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    const parametros = new URLSearchParams(window.location.search);
    const codigo = parametros.get("code");
    const fragmento = new URLSearchParams(window.location.hash.slice(1));
    const tokenAcesso = fragmento.get("access_token");
    const tokenRenovacao = fragmento.get("refresh_token");
    const falhou =
      parametros.get("error_description") || parametros.get("error") || fragmento.get("error");
    window.history.replaceState(null, "", window.location.pathname);
    const dados = codigo
      ? { codigo }
      : tokenAcesso && tokenRenovacao
        ? { tokenAcesso, tokenRenovacao }
        : null;
    if (!dados || falhou) {
      definirErro(
        "O endereço de confirmação é inválido ou expirou. Solicite um novo cadastro ou entre na sua conta.",
      );
      return;
    }
    api("/auth/confirmar-email", { method: "POST", body: dados })
      .then(() => navegar("/painel", { replace: true }))
      .catch((e) => definirErro(e.message));
  }, [navegar]);

  return (
    <div className="conteudo estreito">
      <div className="introducao">
        <span className="sobretitulo">ÁREA DA ONG</span>
        <h1>Confirmando seu e-mail</h1>
      </div>
      {erro ? (
        <div className="cartao-formulario">
          <div className="aviso" role="alert">
            {erro}
          </div>
          <Link className="botao escuro" to="/entrar">
            Ir para a página de entrada
          </Link>
        </div>
      ) : (
        <div className="carregando" role="status">
          <span className="indicador-carregamento" />
          Aguarde a confirmação…
        </div>
      )}
    </div>
  );
}
