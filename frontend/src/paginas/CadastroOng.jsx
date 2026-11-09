import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, AREAS } from "../api";
import { Campo, Introducao, Carregando, Aviso } from "../componentes/Comum";
import { ongVazia } from "../utilitarios/constantes";
import { gerarCnpjFicticio } from "../utilitarios/formatadores";

export default function CadastroOng() {
  const navegar = useNavigate();
  const [autorizado, definirAutorizado] = useState(false);
  const [erroAcesso, definirErroAcesso] = useState("");
  const [errosDosCampos, definirErrosDosCampos] = useState({});
  const [valoresDoFormulario, definirValoresDoFormulario] = useState({
      ...ongVazia,
      area: "",
      cnpj: "",
      responsavel: "",
      referencias: "",
    }),
    [ocupado, definirOcupado] = useState(false),
    [erro, definirErro] = useState("");
  useEffect(() => {
    let ativo = true;
    api("/auth/me")
      .then(async (conta) => {
        if (!ativo) return;
        if (conta.papel === "admin") navegar("/admin", { replace: true });
        else if (conta.papel === "ong") {
          const painel = await api("/painel");
          if (!ativo) return;
          if (painel.situacao === "sem_ong") definirAutorizado(true);
          else navegar("/painel", { replace: true });
        } else definirErroAcesso("Esta conta não pode cadastrar uma ONG.");
      })
      .catch((e) => {
        if (!ativo) return;
        if (e.status === 401)
          navegar("/entrar?proximo=%2Fsolicitar", { replace: true });
        else definirErroAcesso(e.message);
      });
    return () => { ativo = false; };
  }, [navegar]);
  async function enviar(e) {
    e.preventDefault();
    if (!autorizado) return;
    definirOcupado(true);
    definirErro("");
    definirErrosDosCampos({});
    try {
      const resultado = await api("/cadastro", {
        method: "POST",
        body: valoresDoFormulario,
      });
      navegar(
        `/painel?cadastro=ong&protocolo=${encodeURIComponent(resultado.protocolo)}`,
        { replace: true },
      );
    } catch (e) {
      if (e.status === 401) {
        navegar("/entrar?proximo=%2Fsolicitar", { replace: true });
        return;
      }
      definirErro(e.message);
      definirErrosDosCampos(e.fields || {});
    } finally {
      definirOcupado(false);
    }
  }
  function preencherExemplo() {
    definirValoresDoFormulario({
      nome: "Associação Exemplo Fictício",
      cnpj: gerarCnpjFicticio(),
      area: "Educação",
      bairro: "Benfica",
      descricao:
        "Exemplo fictício de associação que oferece oficinas de leitura e apoio escolar para crianças da comunidade.",
      endereco: "Rua Exemplo, 100, Fortaleza - CE",
      responsavel: "Maria da Silva (exemplo)",
      contato: "contato@exemplo.org",
      site: "https://exemplo.org",
      referencias:
        "Dados fictícios para demonstração da apresentação. Não representam uma instituição real.",
    });
    definirErrosDosCampos({});
  }
  if (!autorizado)
    return (
      <div className="conteudo">
        {erroAcesso ? <Aviso>{erroAcesso}</Aviso> : <Carregando />}
      </div>
    );
  return (
    <div className="conteudo">
      <Introducao
        sobretitulo="FAÇA PARTE"
        titulo="Solicitar inclusão de uma ONG"
        texto="Apresente sua instituição. A equipe confere os dados antes de publicar a página no EloSocial."
      />

      <button
        type="button"
        className="botao botao-exemplo"
        onClick={preencherExemplo}
      >
        Preencher exemplo fictício
      </button>
      <div className="estrutura-cadastro">
        <form className="cartao-formulario" onSubmit={enviar}>
          <Aviso>{erro}</Aviso>
          <div className="grade-formulario">
            <Campo
              erros={errosDosCampos}
              rotulo="Nome da instituição"
              nome="nome"
              placeholder="Ex.: Instituto Comunidade Viva"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
              minLength={3}
              maxLength={120}
            />

            <Campo
              erros={errosDosCampos}
              rotulo="CNPJ"
              nome="cnpj"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              minLength={14}
              maxLength={18}
            />

            <Campo
              erros={errosDosCampos}
              rotulo="Área de atuação"
              nome="area"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
            >
              <option value="" disabled>
                Selecione uma área
              </option>
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Campo>
            <Campo
              erros={errosDosCampos}
              rotulo="Bairro da sede"
              nome="bairro"
              placeholder="Ex.: Benfica"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
              minLength={2}
            />

            <Campo
              erros={errosDosCampos}
              rotulo="Descrição da instituição"
              nome="descricao"
              tipo="textarea"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
              minLength={20}
              maxLength={1000}
              placeholder="Ex.: Oferecemos reforço escolar e oficinas de leitura para crianças e adolescentes do bairro. Descreva a atuação em pelo menos 20 caracteres."
            />

            <Campo
              erros={errosDosCampos}
              rotulo="Endereço público (opcional)"
              nome="endereco"
              placeholder="Ex.: Rua das Flores, 120, Fortaleza - CE"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
              obrigatorio={false}
            />

            <Campo
              erros={errosDosCampos}
              rotulo="Responsável pela solicitação"
              nome="responsavel"
              placeholder="Ex.: Maria da Silva"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
              minLength={3}
            />

            <Campo
              erros={errosDosCampos}
              rotulo="E-mail ou telefone de contato"
              nome="contato"
              placeholder="Ex.: contato@instituicao.org ou (85) 99999-0000"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
              minLength={5}
            />

            <Campo
              erros={errosDosCampos}
              rotulo="Site ou rede social (opcional)"
              nome="site"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
              obrigatorio={false}
              prefixoUrl
              placeholder="suaong.org.br"
            />

            <Campo
              erros={errosDosCampos}
              rotulo="Referências públicas para conferência"
              nome="referencias"
              tipo="textarea"
              valores={valoresDoFormulario}
              definirValores={definirValoresDoFormulario}
              minLength={10}
              maxLength={1000}
              placeholder="Cole endereços de registros públicos, do site oficial ou de notícias que ajudem a confirmar a atuação da instituição."
            />
          </div>
          <p className="dica">
            Informe apenas dados que possam ser divulgados na página da ONG. O
            nome do responsável e as referências ficam restritos à equipe. O
            envio será analisado antes da publicação.
          </p>
          <div className="acoes-formulario">
            <span className="dica">* Campos obrigatórios</span>
            <button className="botao escuro" disabled={ocupado}>
              {ocupado ? "Enviando…" : "Enviar solicitação →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
