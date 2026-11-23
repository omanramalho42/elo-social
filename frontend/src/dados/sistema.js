const grupos = {
  "Acesso público": [
    ["Mapa de ONGs", "Marcadores das instituições aprovadas e acesso aos perfis em Fortaleza.", "/", ["GET /api/ongs"]],
    ["Catálogo de instituições", "Lista de ONGs publicadas com identificação e área de atuação.", "/catalogo", ["GET /api/ongs"]],
    ["Busca no catálogo", "Busca textual por nome, bairro ou área de atuação.", "/catalogo", ["GET /api/ongs"]],
    ["Filtro por área", "Educação, assistência social, meio ambiente, saúde e cultura.", "/catalogo", ["GET /api/ongs"]],
    ["Perfil da ONG", "Descrição, endereço, contato, site e indicação da verificação institucional.", "/ongs/:id", ["GET /api/ongs/{id}"]],
    ["Projetos públicos", "Iniciativas da instituição exibidas em sua página pública.", "/ongs/:id", ["GET /api/ongs/{id}"]],
    ["Paginação e filtro por bairro na API", "Parâmetros pagina, limite e bairro; a tela atual consulta até 100 instituições.", null, ["GET /api/ongs"]],
  ],
  "Contas e autenticação": [
    ["Criar acesso de gestor", "Nome, e-mail, celular e senha com confirmação; validação na tela e no servidor.", "/criar-conta", ["POST /api/auth/registrar"]],
    ["Confirmar e-mail", "Supabase Auth envia o e-mail e a aplicação processa o retorno autorizado.", "/confirmar-email", ["POST /api/auth/confirmar-email"]],
    ["Entrar na conta", "Autenticação e direcionamento conforme o perfil da conta.", "/entrar", ["POST /api/auth/login"]],
    ["Consultar sessão", "Conta e papel validados no servidor; sessão em cookie HttpOnly.", "/painel", ["GET /api/auth/me"]],
    ["Sair da conta", "Encerramento da sessão nos painéis.", "/painel", ["POST /api/auth/logout"]],
    ["Solicitar recuperação de senha", "Único envio de recuperação pelo Supabase Auth, sujeito aos limites do provedor.", "/recuperar-senha", ["POST /api/auth/recuperar-senha"]],
    ["Validar retorno de recuperação", "Processamento do código ou da sessão do link recebido.", "/redefinir-senha", ["POST /api/auth/confirmar-recuperacao"]],
    ["Redefinir senha", "Atualização da senha após validar o retorno de recuperação.", "/redefinir-senha", ["POST /api/auth/redefinir-senha"]],
  ],
  "Gestão da instituição": [
    ["Solicitar inclusão de ONG", "Conta confirmada envia o cadastro para análise e recebe vínculo automático.", "/solicitar", ["POST /api/cadastro"]],
    ["Validar dados de cadastro", "CNPJ válido e único, contato, área, limites de texto e referências obrigatórias.", "/solicitar", ["POST /api/cadastro"]],
    ["Acompanhar situação", "Painel apresenta vínculo, análise pendente, aprovação ou rejeição.", "/painel", ["GET /api/painel"]],
    ["Editar instituição", "Gestor da ONG aprovada edita os campos permitidos; situação e posição são da equipe.", "/painel/editar", ["PATCH /api/painel"]],
    ["Excluir a própria instituição e conta", "Exclusão com confirmação explícita; não há botão correspondente na interface atual.", null, ["DELETE /api/painel"]],
    ["Listar projetos", "Consulta dos projetos da própria instituição.", "/painel/projetos", ["GET /api/painel/projetos"]],
    ["Criar projeto", "Nome e descrição opcional para nova iniciativa da instituição.", "/painel/projetos", ["POST /api/painel/projetos"]],
    ["Editar projeto", "Atualização de iniciativa vinculada à ONG do gestor.", "/painel/projetos", ["PATCH /api/painel/projetos/{id}"]],
    ["Remover projeto", "Exclusão de projeto com confirmação na interface.", "/painel/projetos", ["DELETE /api/painel/projetos/{id}"]],
  ],
  "Administração": [
    ["Filas de revisão", "Cadastros agrupados em verificação, aprovados e rejeitados.", "/admin", ["GET /api/admin/ongs"]],
    ["Conferir dados privados de cadastro", "Administrador consulta responsável e referências para a decisão.", "/admin", ["GET /api/admin/ongs"]],
    ["Preencher localização pelo endereço", "Busca automática de coordenadas, com mapa e campos editáveis para conferência. Endereços não encontrados exigem ajuste.", "/admin", ["GET /api/admin/ongs/{id}/localizacao", "PATCH /api/admin/ongs/{id}"]],
    ["Aprovar e publicar", "Cadastro aprovado passa a integrar mapa e catálogo público.", "/admin", ["PATCH /api/admin/ongs/{id}"]],
    ["Registrar verificação institucional", "Dados públicos conferidos e vínculo institucional confirmado são situações distintas.", "/admin", ["PATCH /api/admin/ongs/{id}"]],
    ["Rejeitar cadastro", "Decisão com motivo obrigatório de 5 a 500 caracteres.", "/admin", ["PATCH /api/admin/ongs/{id}"]],
    ["Vincular gestor", "Associa conta confirmada e autorizada a cadastro antigo sem gestor.", "/admin", ["POST /api/admin/ongs/{id}/gestor"]],
    ["Desvincular gestor", "Operação administrativa disponível somente pela API.", null, ["DELETE /api/admin/ongs/{id}/gestor"]],
    ["Excluir ONG e conta vinculada", "Operação administrativa com confirmação; disponível somente pela API.", null, ["DELETE /api/admin/ongs/{id}"]],
  ],
  "Operação e documentação": [
    ["Saúde básica", "Resposta da API e leitura pública do banco, usada pelo Render.", null, ["GET /api/saude"]],
    ["Diagnóstico detalhado", "Estado dos serviços, metadados públicos de publicação e inventário OpenAPI.", "/health", ["GET /api/saude/detalhes"]],
    ["Especificação OpenAPI", "Contrato dos endpoints, parâmetros, corpos, respostas e autenticação.", null, ["GET /api/openapi"]],
    ["Swagger UI", "Documentação interativa no backend. Operações de escrita precisam de sessão e origem permitida.", "/docs", []],
    ["Atalho Shift + S", "Abre este painel fora de campos de digitação; não envia requisições de escrita.", "/health", []],
    ["Página não encontrada", "Rotas desconhecidas exibem orientação para voltar ao mapa.", "/*", []],
    ["Modo escuro", "Alternância no cabeçalho, com preferência salva no navegador e aplicada às telas, formulários e mapa.", "/", []],
    ["Desempenho e mapa de calor", "Resultados de carga local isolada por rota e concorrência; projeção explícita de demanda para 50 milhões ou mais, sem atestar capacidade de produção.", "/health?aba=desempenho", []],
  ],
};

export const funcionalidades = Object.entries(grupos).flatMap(([grupo, itens]) => itens.map(([nome, descricao, tela, rotas]) => ({ grupo, nome, descricao, tela, rotas }))).map((item, indice) => ({ ...item, numero: indice + 1 }));
export const gruposFuncionais = Object.keys(grupos);
export const integrarTexto = (texto) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export const integracoes = [
  ["Supabase Data API", "API externa · execução", "A API Next.js usa o SDK Supabase para acessar o PostgreSQL via PostgREST.", "https://supabase.com/docs/guides/api"],
  ["Supabase Auth", "API externa · execução", "Autenticação, sessão, confirmação de e-mail e recuperação de senha. Os e-mails são enviados pelo Auth, sem serviço de e-mail próprio no backend.", "https://supabase.com/docs/guides/auth"],
  ["OpenStreetMap", "Recurso externo · mapas", "Tiles cartográficos exibidos pelo Leaflet no navegador. Não é usado como banco de ONGs.", "https://www.openstreetmap.org/copyright"],
  ["Photon", "API externa · geocodificação", "Busca coordenadas pelo endereço institucional na administração, com cache, fila e ajuste no mapa. Pode localizar apenas a via; a equipe confere o número antes de aprovar.", "https://github.com/komoot/photon"],
  ["Google Fonts", "Recurso externo · interface", "Fontes DM Sans e Manrope usadas na identidade visual.", "https://fonts.google.com/"],
  ["jsDelivr", "Recurso externo · documentação", "Distribuição dos arquivos do Swagger UI; usado somente em /docs.", "https://www.jsdelivr.com/"],
  ["Nominatim", "Referência de preparação dos dados", "Fonte de geocodificação referenciada na preparação dos dados importados; não é chamada por este painel nem pelo fluxo de aprovação.", "https://nominatim.org/"],
];
export const tabelas = [
  ["auth.users", "Contas e credenciais sob gestão do Supabase Auth."],
  ["perfis", "Papel da conta (gestor ou administrador) e dados de perfil."],
  ["ongs", "Dados institucionais, gestor vinculado, situação, coordenadas e verificação."],
  ["ongs_privado", "Responsável e referências do cadastro, com acesso restrito."],
  ["projetos", "Iniciativas relacionadas a uma instituição."],
];
