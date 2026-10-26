// Especificação OpenAPI 3.0 da API do EloSocial (alimenta o Swagger UI em /docs).
const AREAS = ["Educação", "Assistência social", "Meio ambiente", "Saúde", "Cultura"];

const erro = (descricao: string) => ({
  description: descricao,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } },
});
const json = (ref: string) => ({ "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } });
const corpo = (ref: string, exemplo?: unknown) => ({
  required: true,
  content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` }, ...(exemplo ? { example: exemplo } : {}) } },
});
const idPath = (nome = "id") => ({ name: nome, in: "path", required: true, schema: { type: "integer", minimum: 1 } });
const sessao = [{ sessaoCookie: [] }];

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "EloSocial API",
    version: "1.0.0",
    description:
      "API do EloSocial: plataforma para ONGs de Fortaleza.\n\n" +
      "**Fluxo (igual ao protótipo):** 1) `POST /api/cadastro` envia a ONG para conferência (sem login); 2) o gestor cria conta em `POST /api/auth/registrar`; " +
      "3) a equipe publica a ONG (`PATCH /api/admin/ongs/{id}`) e vincula o gestor (`POST /api/admin/ongs/{id}/gestor`); 4) `POST /api/auth/login` e use as rotas com cadeado.\n\n" +
      "**CRUD de ONGs:** Create `POST /api/cadastro` · Read `GET /api/ongs` · Update `PATCH /api/painel` · Delete `DELETE /api/painel`.\n" +
      "**CRUD de Projetos:** Create `POST /api/painel/projetos` · Read `GET /api/painel/projetos` · Update `PATCH /api/painel/projetos/{id}` · Delete `DELETE /api/painel/projetos/{id}`.",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "ONGs (público)", description: "Mapa e catálogo" },
    { name: "Cadastro e sessão" },
    { name: "Painel da ONG", description: "CRUD da própria ONG e dos seus projetos" },
    { name: "Administração", description: "Moderação pela equipe" },
  ],
  paths: {
    "/api/ongs": {
      get: {
        tags: ["ONGs (público)"], summary: "Listar ONGs aprovadas (Read)",
        parameters: [
          { name: "q", in: "query", schema: { type: "string", maxLength: 60 }, description: "Busca por nome, área ou bairro" },
          { name: "area", in: "query", schema: { type: "string", enum: AREAS } },
          { name: "pagina", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limite", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
        ],
        responses: {
          200: { description: "Lista paginada", content: json("ListaOngs") },
          422: erro("Filtro inválido"),
        },
      },
    },
    "/api/ongs/{id}": {
      get: {
        tags: ["ONGs (público)"], summary: "Ver uma ONG e seus projetos (Read)",
        parameters: [idPath()],
        responses: { 200: { description: "ONG", content: json("OngDetalhe") }, 404: erro("ONG não encontrada ou não aprovada") },
      },
    },
    "/api/cadastro": {
      post: {
        tags: ["Cadastro e sessão"], summary: "Cadastrar ONG para conferência (Create)",
        description: "Tela **Cadastrar ONG**. Não exige login. A ONG entra como `pendente` e **não** é publicada nem libera acesso de gestor. Limite: 5 por hora por IP.",
        requestBody: corpo("CadastroOng", {
          nome: "Associação Exemplo", cnpj: "11.222.333/0001-81", descricao: "Atendimento e acompanhamento de famílias da comunidade.",
          area: "Saúde", bairro: "Aldeota", endereco: "Rua Exemplo, 100", responsavel: "Maria Silva",
          contato: "contato@exemplo.org", site: "https://exemplo.org", referencias: "Instagram @exemplo e CNPJ na Receita Federal",
        }),
        responses: {
          201: { description: "Pedido enviado", content: json("MensagemProtocolo") },
          409: erro("CNPJ já cadastrado"), 422: erro("Dados inválidos"), 429: erro("Muitas tentativas"),
        },
      },
    },
    "/api/auth/registrar": {
      post: {
        tags: ["Cadastro e sessão"], summary: "Criar conta de gestor",
        description: "Tela **Área da ONG > Cadastre-se**. Cria só a conta; a equipe vincula a uma ONG depois.",
        requestBody: corpo("Registrar", { nome: "Maria Silva", email: "maria@exemplo.org", telefone: "(85) 99999-1234", senha: "senha1234", confirmarSenha: "senha1234" }),
        responses: { 201: { description: "Conta criada", content: json("Mensagem") }, 422: erro("Dados inválidos"), 429: erro("Muitas tentativas") },
      },
    },
    "/api/auth/recuperar-senha": {
      post: {
        tags: ["Cadastro e sessão"], summary: "Esqueci minha senha",
        description: "Envia o e-mail de recuperação. A resposta é sempre a mesma, exista ou não o e-mail.",
        requestBody: corpo("RecuperarSenha", { email: "maria@exemplo.org" }),
        responses: { 200: { description: "Instruções enviadas (se o e-mail existir)", content: json("Mensagem") }, 429: erro("Muitas tentativas") },
      },
    },
    "/api/auth/redefinir-senha": {
      post: {
        tags: ["Cadastro e sessão"], summary: "Definir nova senha", security: sessao,
        requestBody: corpo("RedefinirSenha", { senha: "novaSenha123" }),
        responses: { 200: { description: "Senha alterada", content: json("Mensagem") }, 401: erro("Sem login"), 422: erro("Senha fraca") },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Cadastro e sessão"], summary: "Entrar",
        description: "Grava o cookie de sessão (httpOnly). Limite de tentativas por IP e por e-mail.",
        requestBody: corpo("Login", { email: "contato@exemplo.org", senha: "senha1234" }),
        responses: { 200: { description: "Login realizado", content: json("Mensagem") }, 401: erro("E-mail ou senha incorretos"), 429: erro("Muitas tentativas") },
      },
    },
    "/api/auth/logout": {
      post: { tags: ["Cadastro e sessão"], summary: "Sair", responses: { 200: { description: "Sessão encerrada", content: json("Mensagem") } } },
    },
    "/api/auth/me": {
      get: {
        tags: ["Cadastro e sessão"], summary: "Quem está logado", security: sessao,
        responses: { 200: { description: "Usuário", content: json("Eu") }, 401: erro("Sem login") },
      },
    },
    "/api/painel": {
      get: {
        tags: ["Painel da ONG"], summary: "Ver a própria ONG (Read)", security: sessao,
        responses: { 200: { description: "ONG do usuário", content: json("Painel") }, 401: erro("Sem login"), 404: erro("Conta ainda sem ONG vinculada") },
      },
      patch: {
        tags: ["Painel da ONG"], summary: "Editar a própria ONG (Update)", security: sessao,
        description: "Altera nome, bairro, área, descrição, endereço, contato e site. Status, CNPJ, verificação, dono e posição no mapa são protegidos pelo banco.",
        requestBody: corpo("EditarOng", {
          nome: "Associação Exemplo", bairro: "Aldeota", area: "Saúde", endereco: "Rua Exemplo, 100",
          descricao: "Nova descrição com mais de vinte caracteres.", contato: "contato@exemplo.org", site: "@exemplo",
        }),
        responses: { 200: { description: "ONG atualizada", content: json("OngDetalhe") }, 401: erro("Sem login"), 404: erro("Conta ainda sem ONG vinculada"), 422: erro("Dados inválidos") },
      },
      delete: {
        tags: ["Painel da ONG"], summary: "Excluir a própria ONG e a conta (Delete)", security: sessao,
        requestBody: corpo("Confirmar", { confirmar: true }),
        responses: { 200: { description: "Excluída", content: json("Mensagem") }, 401: erro("Sem login"), 404: erro("Conta ainda sem ONG vinculada"), 422: erro("Confirmação ausente") },
      },
    },
    "/api/painel/projetos": {
      get: {
        tags: ["Painel da ONG"], summary: "Listar os projetos da própria ONG (Read)", security: sessao,
        responses: { 200: { description: "Projetos", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Projeto" } } } } }, 401: erro("Sem login"), 404: erro("Conta ainda sem ONG vinculada") },
      },
      post: {
        tags: ["Painel da ONG"], summary: "Criar projeto (Create)", security: sessao,
        requestBody: corpo("ProjetoEntrada", { nome: "Biblioteca aberta", descricao: "Rodas de leitura gratuitas aos sábados." }),
        responses: { 201: { description: "Projeto criado", content: json("Projeto") }, 401: erro("Sem login"), 422: erro("Dados inválidos ou limite de 30 projetos") },
      },
    },
    "/api/painel/projetos/{id}": {
      patch: {
        tags: ["Painel da ONG"], summary: "Editar projeto (Update)", security: sessao, parameters: [idPath()],
        requestBody: corpo("ProjetoEntrada", { nome: "Biblioteca aberta", descricao: "Agora também aos domingos." }),
        responses: { 200: { description: "Atualizado", content: json("Projeto") }, 401: erro("Sem login"), 404: erro("Projeto não encontrado"), 422: erro("Dados inválidos") },
      },
      delete: {
        tags: ["Painel da ONG"], summary: "Excluir projeto (Delete)", security: sessao, parameters: [idPath()],
        responses: { 200: { description: "Removido", content: json("Mensagem") }, 401: erro("Sem login"), 404: erro("Projeto não encontrado") },
      },
    },
    "/api/admin/ongs": {
      get: {
        tags: ["Administração"], summary: "Fila de ONGs por status (Read)", security: sessao,
        parameters: [{ name: "status", in: "query", schema: { type: "string", enum: ["pendente", "aprovada", "rejeitada"], default: "pendente" } }],
        responses: { 200: { description: "Lista (inclui CNPJ)", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } }, 401: erro("Sem login"), 403: erro("Só equipe") },
      },
    },
    "/api/admin/ongs/{id}/gestor": {
      post: {
        tags: ["Administração"], summary: "Vincular gestor à ONG", security: sessao, parameters: [idPath()],
        requestBody: corpo("Gestor", { email: "maria@exemplo.org" }),
        responses: { 200: { description: "Vinculado", content: json("Mensagem") }, 403: erro("Só equipe"), 404: erro("ONG ou conta não encontrada"), 409: erro("Gestor já vinculado a outra ONG") },
      },
      delete: {
        tags: ["Administração"], summary: "Remover vínculo do gestor", security: sessao, parameters: [idPath()],
        responses: { 200: { description: "Vínculo removido", content: json("Mensagem") }, 403: erro("Só equipe"), 404: erro("ONG não encontrada") },
      },
    },
    "/api/admin/ongs/{id}": {
      patch: {
        tags: ["Administração"], summary: "Publicar ou rejeitar ONG (Update)", security: sessao, parameters: [idPath()],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { oneOf: [{ $ref: "#/components/schemas/Aprovar" }, { $ref: "#/components/schemas/Rejeitar" }] } } },
        },
        responses: { 200: { description: "Status atualizado", content: { "application/json": { schema: { type: "object", properties: { id: { type: "integer" }, status: { type: "string" } } } } } }, 403: erro("Só equipe"), 404: erro("ONG não encontrada"), 422: erro("Dados inválidos") },
      },
      delete: {
        tags: ["Administração"], summary: "Excluir qualquer ONG (Delete)", security: sessao, parameters: [idPath()],
        requestBody: corpo("Confirmar", { confirmar: true }),
        responses: { 200: { description: "Excluída", content: json("Mensagem") }, 403: erro("Só equipe"), 404: erro("ONG não encontrada") },
      },
    },
  },
  components: {
    securitySchemes: {
      sessaoCookie: { type: "apiKey", in: "cookie", name: "sb-auth-token", description: "Cookie gravado por /api/auth/login (httpOnly)." },
    },
    schemas: {
      Erro: { type: "object", properties: { erro: { type: "string" }, detalhes: { type: "array", items: { type: "object" } } } },
      Mensagem: { type: "object", properties: { mensagem: { type: "string" } } },
      Eu: { type: "object", properties: { email: { type: "string" }, nome: { type: "string", nullable: true }, telefone: { type: "string", nullable: true }, papel: { type: "string", enum: ["ong", "admin"] }, ongVinculadaId: { type: "integer", nullable: true } } },
      CadastroOng: {
        type: "object", additionalProperties: false,
        required: ["nome", "descricao", "area", "bairro", "responsavel", "contato", "referencias"],
        properties: {
          nome: { type: "string", minLength: 3, maxLength: 120 }, cnpj: { type: "string", description: "Opcional. CNPJ válido, com ou sem máscara" },
          descricao: { type: "string", minLength: 20, maxLength: 1000 }, area: { type: "string", enum: AREAS },
          bairro: { type: "string", minLength: 2, maxLength: 80 }, endereco: { type: "string", maxLength: 200, description: "Opcional (endereço público)" },
          responsavel: { type: "string", minLength: 3, maxLength: 120 }, contato: { type: "string", minLength: 5, maxLength: 120 },
          site: { type: "string", description: "Opcional. Link https://... ou @perfil" },
          referencias: { type: "string", minLength: 10, maxLength: 1000, description: "Fonte pública ou referências para a conferência" },
        },
      },
      Registrar: {
        type: "object", additionalProperties: false, required: ["nome", "email", "telefone", "senha", "confirmarSenha"],
        properties: {
          nome: { type: "string" }, email: { type: "string", format: "email" }, telefone: { type: "string", description: "10 ou 11 dígitos" },
          senha: { type: "string", minLength: 8, maxLength: 72, description: "Ao menos 1 letra e 1 número" }, confirmarSenha: { type: "string" },
        },
      },
      RecuperarSenha: { type: "object", additionalProperties: false, required: ["email"], properties: { email: { type: "string", format: "email" } } },
      RedefinirSenha: { type: "object", additionalProperties: false, required: ["senha"], properties: { senha: { type: "string", minLength: 8 } } },
      Gestor: { type: "object", additionalProperties: false, required: ["email"], properties: { email: { type: "string", format: "email" } } },
      MensagemProtocolo: { type: "object", properties: { mensagem: { type: "string" }, protocolo: { type: "integer" } } },
      Login: { type: "object", additionalProperties: false, required: ["email", "senha"], properties: { email: { type: "string", format: "email" }, senha: { type: "string" } } },
      EditarOng: {
        type: "object", additionalProperties: false, required: ["nome", "bairro", "area", "descricao", "contato"],
        properties: {
          nome: { type: "string", minLength: 3, maxLength: 120 }, bairro: { type: "string" }, area: { type: "string", enum: AREAS },
          descricao: { type: "string", minLength: 20, maxLength: 1000 }, endereco: { type: "string", nullable: true },
          contato: { type: "string", minLength: 5, maxLength: 120 }, site: { type: "string", nullable: true },
        },
      },
      ProjetoEntrada: { type: "object", additionalProperties: false, required: ["nome"], properties: { nome: { type: "string", minLength: 2, maxLength: 100 }, descricao: { type: "string", maxLength: 500, nullable: true } } },
      Projeto: { type: "object", properties: { id: { type: "integer" }, nome: { type: "string" }, descricao: { type: "string", nullable: true } } },
      Confirmar: { type: "object", additionalProperties: false, required: ["confirmar"], properties: { confirmar: { type: "boolean", enum: [true] } } },
      Aprovar: {
        type: "object", additionalProperties: false, required: ["acao", "lat", "lon"],
        properties: { acao: { type: "string", enum: ["aprovar"] }, lat: { type: "number", minimum: -4.1, maximum: -3.6 }, lon: { type: "number", minimum: -38.8, maximum: -38.3 }, verificacao: { type: "string", enum: ["demonstrativo", "nao_verificado", "verificado"], default: "nao_verificado" } },
      },
      Rejeitar: {
        type: "object", additionalProperties: false, required: ["acao", "motivo"],
        properties: { acao: { type: "string", enum: ["rejeitar"] }, motivo: { type: "string", minLength: 5, maxLength: 500 } },
      },
      Ong: {
        type: "object",
        properties: {
          id: { type: "integer" }, nome: { type: "string" }, bairro: { type: "string" }, area: { type: "string", enum: AREAS },
          descricao: { type: "string" }, lat: { type: "number", nullable: true }, lon: { type: "number", nullable: true },
          verificacao: { type: "string", enum: ["demonstrativo", "nao_verificado", "verificado"], description: "Situação dos dados" },
          totalProjetos: { type: "integer" },
        },
      },
      ListaOngs: { type: "object", properties: { total: { type: "integer" }, pagina: { type: "integer" }, ongs: { type: "array", items: { $ref: "#/components/schemas/Ong" } } } },
      OngDetalhe: {
        allOf: [{ $ref: "#/components/schemas/Ong" }, { type: "object", properties: { endereco: { type: "string", nullable: true }, contato: { type: "string" }, cnpj: { type: "string", nullable: true }, site: { type: "string", nullable: true }, projetos: { type: "array", items: { $ref: "#/components/schemas/Projeto" } } } }],
      },
      Painel: {
        allOf: [
          { $ref: "#/components/schemas/OngDetalhe" },
          { type: "object", properties: { status: { type: "string", enum: ["pendente", "aprovada", "rejeitada"] }, motivo_rejeicao: { type: "string", nullable: true } } },
        ],
      },
    },
  },
};
