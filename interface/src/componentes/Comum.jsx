import { Link } from "react-router-dom";
import {
  formatarCnpj,
  formatarTelefone,
  formatarContato,
  somenteDominio,
  urlDoSite,
} from "../utilitarios/formatadores";

export function Marca() {
  return (
    <Link className="marca" to="/">
      <svg
        width="33"
        height="33"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="10"
          width="18"
          height="11"
          rx="5.5"
          transform="rotate(-42 12 16)"
          stroke="currentColor"
          strokeWidth="2.4"
        />

        <rect
          x="12"
          y="10"
          width="18"
          height="11"
          rx="5.5"
          transform="rotate(-42 21 16)"
          stroke="currentColor"
          strokeWidth="2.4"
        />
      </svg>
      EloSocial<span className="ponto-marca">.</span>
    </Link>
  );
}
export function Aviso({ children: conteudo, sucesso = false }) {
  return conteudo ? (
    <div
      role={sucesso ? "status" : "alert"}
      className={`aviso ${sucesso ? "sucesso" : ""}`}
    >
      {conteudo}
    </div>
  ) : null;
}
export function Carregando() {
  return (
    <div className="carregando" role="status">
      <span className="indicador-carregamento" />
      Carregando informações…
    </div>
  );
}
export function Introducao({ sobretitulo, titulo, texto, children: conteudo }) {
  return (
    <div className="introducao">
      <div>
        <span className="sobretitulo">{sobretitulo}</span>
        <h1>{titulo}</h1>
        {texto && <p>{texto}</p>}
      </div>
      {conteudo}
    </div>
  );
}
export function Campo({
  rotulo,
  nome,
  valores,
  definirValores,
  tipo = "text",
  obrigatorio = true,
  children: conteudo,
  erros = {},
  prefixoUrl = false,
  ...restante
}) {
  const mensagem = erros[nome];
  const propriedades = {
    id: nome,
    name: nome,
    value: prefixoUrl ? somenteDominio(valores[nome]) : (valores[nome] ?? ""),
    onChange: (e) => {
      const textoBruto = e.target.value;
      const valor = prefixoUrl
        ? urlDoSite(textoBruto)
        : nome === "cnpj"
          ? formatarCnpj(textoBruto)
          : nome === "telefone"
            ? formatarTelefone(textoBruto)
            : nome === "contato"
              ? formatarContato(textoBruto)
              : textoBruto;
      definirValores({ ...valores, [nome]: valor });
    },
    required: obrigatorio,
    "aria-invalid": Boolean(mensagem),
    "aria-describedby": mensagem ? `${nome}-error` : undefined,
    ...restante,
  };
  return (
    <label
      className={`campo ${nome === "descricao" || nome === "referencias" ? "largo" : ""}`}
      htmlFor={nome}
    >
      {rotulo}
      {obrigatorio && <span className="obrigatorio"> *</span>}
      {conteudo ? (
        <select {...propriedades}>{conteudo}</select>
      ) : tipo === "textarea" ? (
        <textarea {...propriedades} rows={4} />
      ) : prefixoUrl ? (
        <span className="entrada-url">
          <span>https://</span>
          <input {...propriedades} type="text" inputMode="url" />
        </span>
      ) : (
        <input {...propriedades} type={tipo} />
      )}
      {mensagem && (
        <span className="erro-campo" id={`${nome}-error`}>
          {mensagem}
        </span>
      )}
    </label>
  );
}
