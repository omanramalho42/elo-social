# Frontend do EloSocial — guia para executar e estudar

## Executar

O projeto tem dois programas locais. O backend Next.js usa a porta 3000. O frontend React/Vite usa a porta 5173.

Na raiz, configure .env.local com as mesmas credenciais do Supabase do backend. Esse arquivo permanece ignorado pelo Git e nunca deve entrar no frontend. A configuração anterior foi reaproveitada nesta máquina; outro integrante precisa configurar seu próprio ambiente.

Terminal 1, na raiz:

```powershell
npm ci
npm run dev -- --port 3000
```

Terminal 2:

```powershell
cd frontend
npm ci
npm run dev
```

Abra http://127.0.0.1:5173. O Swagger continua em http://localhost:3000/docs.

Nas próximas vezes, com as dependências instaladas, basta executar os comandos npm run dev. O arquivo INICIAR-ELOSOCIAL.cmd na raiz abre os dois programas. Não o execute se os dois já estiverem ligados.

## Como funciona

1. main.jsx carrega React e o roteador.
2. App.jsx define o cabeçalho, rodapé e rotas das telas.
3. O usuário abre uma tela ou envia um formulário.
4. api.js utiliza fetch para chamar /api no mesmo endereço do frontend.
5. vite.config.js encaminha /api ao backend na porta 3000. A origem encaminhada corresponde ao SITE_URL=http://localhost:3000 do backend.
6. O backend existente valida os dados e as permissões e acessa Supabase/PostgreSQL.
7. A resposta chega ao React, que atualiza a tela.

A configuração de proxy é para desenvolvimento local. Publicação exigirá encaminhar /api no servidor de hospedagem e configurar a origem real de produção. Não publique apenas dist esperando que a API apareça automaticamente.

## Arquivos para estudar

| Arquivo | O que aprender |
|---|---|
| frontend/src/main.jsx | Ponto de entrada do React |
| frontend/src/App.jsx | Componentes e páginas |
| frontend/src/api.js | fetch, JSON, cookies e tratamento de erros |
| frontend/src/styles.css | Layout, cores e adaptações para celular |
| frontend/vite.config.js | Execução local e proxy para a API |

## Componentes em App.jsx

- App: estrutura geral e rotas.
- Brand: marca simples com elos em SVG.
- Intro: título e descrição de uma página.
- Field: campo compartilhado dos formulários.
- Notice: mensagens de sucesso e erro.
- Discover: mapa e catálogo. Os dois usam a mesma consulta de ONGs.
- OngCard: cartão de instituição no catálogo.
- Profile: perfil da ONG e seus projetos.
- Request: solicitação de inclusão e confirmação com protocolo.
- Login: autenticação com e-mail e senha.
- Register: criação de acesso, sem vincular automaticamente à ONG.
- Recover: solicitação de recuperação por e-mail.
- Dashboard: sessão, dados da instituição e navegação do gestor.
- EditOng: formulário que faz PATCH na instituição.
- Projects: criação, edição e remoção de projetos, com confirmação de exclusão.

## Conceitos que você deve saber explicar

- Componente: função que retorna uma parte da interface.
- JSX: forma de escrever a estrutura visual dentro do JavaScript.
- Props: informações que um componente recebe.
- useState: guarda valores da tela. Ao mudar um estado, React atualiza a interface.
- useEffect: executa uma ação como consultar a API ao abrir a página.
- onSubmit: ação executada quando um formulário é enviado.
- preventDefault: impede o navegador de recarregar a página ao enviar o formulário.
- fetch: envia uma requisição HTTP ao backend.
- async/await: permite aguardar operações como consultas de rede.
- map: transforma uma lista de dados em cartões ou linhas na tela.
- Rotas: associam endereços como /catalogo e /painel às páginas.
- Cookie HttpOnly: mantém a sessão sem expor o token ao JavaScript do frontend.

## Ordem sugerida de estudo

1. Abrir main.jsx e encontrar App.
2. Em App.jsx, ler Brand e o cabeçalho.
3. Ler OngCard: é um componente pequeno com dados recebidos por props.
4. Ler Discover e identificar useState e useEffect.
5. Ler api.js e localizar fetch.
6. Ler Login e acompanhar onSubmit → API → navegação para /painel.
7. Ler EditOng e relacionar o formulário ao PATCH feito no Postman.
8. Ler Projects e identificar POST, PATCH e DELETE.
9. Alterar um título ou espaçamento no CSS para observar a atualização do Vite.

## Roteiro de demonstração

1. Abrir mapa e clicar em um marcador.
2. Abrir perfil da ONG.
3. Ir ao catálogo, pesquisar por bairro e filtrar por área.
4. Mostrar solicitação de inclusão (enviar somente dados verdadeiros/autorizados).
5. Fazer login com o gestor de demonstração.
6. Editar a instituição e conferir o resultado no perfil.
7. Criar um projeto, editar e conferir na página pública.
8. Demonstrar a confirmação de remoção. Excluir somente um projeto descartável criado para teste.
9. Sair e confirmar que o painel pede login novamente.

## Limites conhecidos

- Não foi criado um banco novo; o projeto utiliza o Supabase existente.
- Não existem pagamentos, inscrições de voluntários ou relatórios.
- Não há painel administrativo visual nesta entrega. Os endpoints administrativos existentes continuam no backend/Swagger/Postman.
- CNPJ é opcional porque a API existente assim define; nenhum cadastro é publicado automaticamente.
- Perfis demonstrativos são identificados. Não representam verificação de uma ONG real.
- O mapa utiliza dados do banco e somente marca coordenadas numéricas na região de Fortaleza.
- O mapa depende de internet e dos mapas do OpenStreetMap.
- Recuperação inclui solicitação, confirmação do código, formulário e sucesso. O envio e a autorização do endereço de retorno dependem da configuração do Supabase.
- Status, verificação, CNPJ e posição são administrados pela equipe.
- Este frontend local ainda precisa de configuração de hospedagem para publicação.

## Verificações

Compilar frontend: cd frontend; npm run build.

Na raiz: npm test e npm run typecheck.

A compilação não substitui ensaio no navegador com o backend ligado.

## Refinamentos da interface

- A lista do mapa permite localizar a ONG e abrir o marcador. Ver perfil continua disponível separadamente.
- Busca e área aplicadas aparecem acima dos resultados, com Limpar filtros.
- Cartões do catálogo identificam perfis demonstrativos e mantêm os links alinhados.
- O cabeçalho consulta a sessão e mostra Meu painel para usuário autenticado.
- Mensagens de validação devolvidas pela API aparecem junto ao campo correspondente.
- A confirmação de remoção permite Escape para cancelar e mantém Tab nos botões do diálogo.
- O link Ir para o conteúdo facilita a navegação por teclado.

Código: OngMarker usa useRef para acessar o marcador Leaflet e useEffect para centralizar o mapa quando a seleção muda. Field recebe errors e mostra a mensagem associada ao nome do campo. api.js converte os detalhes de validação em mensagens por campo. São funções do React e objetos JavaScript comuns, sem nova biblioteca de estado ou formulários.

Verificação dos refinamentos: compilação Vite passou. A conexão do navegador automatizado ficou indisponível nesta revisão; conferir visualmente a seleção do mapa, o teclado e o comportamento no celular antes da apresentação. Os testes ao vivo da versão anterior continuam registrados em VERIFICACAO-FRONTEND.md.


## Recuperação de senha — fluxo completo no código

1. Recover envia o e-mail a POST /api/auth/recuperar-senha.
2. O backend pede ao Supabase o envio do link e guarda a verificação PKCE em cookie.
3. O usuário abre o link no MESMO navegador e endereço usados para solicitar.
4. O Supabase retorna para /redefinir-senha?code=... no frontend.
5. ResetPassword.jsx envia o código de uso único a POST /api/auth/confirmar-recuperacao e remove o código da barra de endereço.
6. O backend troca o código pela sessão em cookie HttpOnly.
7. O usuário preenche e confirma a nova senha; POST /api/auth/redefinir-senha valida e grava.
8. A sessão local é encerrada e a tela de sucesso oferece o retorno ao login.

O formulário não aceita acesso apenas por abrir a URL sem um link válido. Links ausentes ou expirados mostram uma mensagem e permitem pedir outro. Não é necessário nem correto colocar service_role no React.

### Configuração externa necessária

No painel Supabase do projeto, em Authentication → URL Configuration → Redirect URLs, autorize exatamente:

http://127.0.0.1:5173/redefinir-senha

Na raiz, .env.local contém FRONTEND_URL=http://127.0.0.1:5173 e SITE_URL=http://localhost:3000. A variável FRONTEND_URL foi acrescentada a .env.example para orientar os outros integrantes.

Durante o ensaio, abra o frontend por http://127.0.0.1:5173. Não alterne para localhost:5173 no meio da recuperação: cookies pertencem ao endereço do navegador. Use um e-mail real controlado pela equipe, com conta previamente criada. O endereço gestor@demo.org não é uma caixa de e-mail acessível para receber mensagens.

Não mude as senhas das contas de demonstração compartilhadas sem combinar com a equipe. O teste de recebimento e de alteração real deve ser feito pelo dono de uma conta de teste.

### O que estudar

ResetPassword.jsx possui um estado status: checking, ready, saving, success ou invalid. Isso controla qual parte da tela aparece. useEffect confirma o link ao abrir a página; salvar valida as duas senhas e envia à API. O useRef impede que a verificação do link de uso único se repita no StrictMode de desenvolvimento do React.

### Mapa em cores

O CSS não aplica mais grayscale à camada de mapas. Leaflet continua usando OpenStreetMap e as coordenadas do banco. A cor do mapa não altera dados, validação ou regras de negócio.
