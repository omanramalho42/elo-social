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
    const falhou =
      parametros.get("error_description") || parametros.get("error");
    window.history.replaceState(null, "", window.location.pathname);
    if (!codigo || falhou) {
      definirErro(
        "O endereço de confirmação é inválido ou expirou. Solicite um novo cadastro ou entre na sua conta.",
      );
      return;
    }
    api("/auth/confirmar-email", { method: "POST", body: { codigo } })
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
