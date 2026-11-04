import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function ResetPassword() {
  const started = useRef(false);
  const [status, setStatus] = useState("checking");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    // O link é de uso único. O ref evita uma segunda troca no StrictMode do React.
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get("code");
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const failed = params.has("error") || hash.has("error");
    window.history.replaceState(null, "", window.location.pathname);
    if (!codigo || failed) {
      setError("Esse link é inválido ou expirou. Solicite um novo e abra no mesmo navegador.");
      setStatus("invalid");
      return;
    }
    api("/auth/confirmar-recuperacao", { method: "POST", body: { codigo } })
      .then(() => setStatus("ready"))
      .catch((e) => { setError(e.message); setStatus("invalid"); });
  }, []);

  async function salvar(e) {
    e.preventDefault();
    setError("");
    const errors = {};
    if (senha.length < 8 || senha.length > 72 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
      errors.senha = "Use de 8 a 72 caracteres, incluindo uma letra e um número.";
    }
    if (senha !== confirmarSenha) errors.confirmarSenha = "As senhas precisam ser iguais.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setStatus("saving");
    try {
      await api("/auth/redefinir-senha", { method: "POST", body: { senha } });
      setSenha(""); setConfirmarSenha(""); setStatus("success");
    } catch (e) {
      setError(e.message); setFieldErrors(e.fields || {});
      setStatus(e.status === 401 ? "invalid" : "ready");
    }
  }

  return <div className="container narrow">
    <div className="intro"><span className="eyebrow">SEGURANÇA DO ACESSO</span>
      <h1>{status === "success" ? "Senha atualizada." : "Defina sua nova senha"}</h1>
      <p>{status === "success" ? "Seu acesso está pronto. Entre novamente com a nova senha." : "Escolha uma senha para voltar a acessar a área da ONG."}</p>
    </div>
    {status === "checking" ? <div className="loading" role="status"><span className="spinner"/>Verificando o link…</div> :
      status === "success" ? <div className="form-card"><div className="notice success" role="status">Sua senha foi alterada com sucesso.</div><Link className="button dark full" to="/entrar">Ir para o login →</Link></div> :
      status === "invalid" ? <div className="form-card"><div className="notice" role="alert">{error}</div><Link className="button dark full" to="/recuperar-senha">Solicitar outro link</Link><Link className="back" to="/entrar">← Voltar para o login</Link></div> :
      <form className="form-card" onSubmit={salvar}>
        {error && <div className="notice" role="alert">{error}</div>}
        <label className="field" htmlFor="nova-senha">Nova senha *
          <input id="nova-senha" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={senha} onChange={e=>setSenha(e.target.value)} aria-invalid={Boolean(fieldErrors.senha)} aria-describedby="senha-ajuda senha-erro"/>
          {fieldErrors.senha && <span className="field-error" id="senha-erro">{fieldErrors.senha}</span>}
        </label>
        <label className="field" htmlFor="confirmar-nova-senha">Confirmar nova senha *
          <input id="confirmar-nova-senha" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={confirmarSenha} onChange={e=>setConfirmarSenha(e.target.value)} aria-invalid={Boolean(fieldErrors.confirmarSenha)} aria-describedby={fieldErrors.confirmarSenha ? "confirmacao-erro" : undefined}/>
          {fieldErrors.confirmarSenha && <span className="field-error" id="confirmacao-erro">{fieldErrors.confirmarSenha}</span>}
        </label>
        <p className="hint" id="senha-ajuda">Use de 8 a 72 caracteres, incluindo letras e números.</p>
        <button className="button dark full" disabled={status === "saving"}>{status === "saving" ? "Salvando…" : "Salvar nova senha →"}</button>
      </form>}
  </div>;
}
