# EloSocial

Plataforma acadêmica para divulgar ONGs e projetos sociais de Fortaleza. O visitante pode encontrar instituições no mapa, pesquisar no catálogo e conhecer suas iniciativas. O gestor pode atualizar os dados da instituição vinculada à sua conta e administrar seus projetos.

## Tecnologias

- Interface: React e Vite.
- Servidor: Next.js, com rotas de API executadas no Node.js.
- Banco de dados: PostgreSQL no Supabase.
- Autenticação: Supabase Auth.
- Mapa: Leaflet e OpenStreetMap.
- Documentação e testes da API: Swagger e Postman.

## Executar localmente

É necessário ter Node.js e npm instalados, além das credenciais do projeto Supabase da equipe.

No Windows, depois de instalar Node/npm ou alterar o PATH, abra um novo terminal. Se o PowerShell bloquear `npm.ps1`, use `npm.cmd` nos comandos abaixo.

Copie `backend/.env.example` para `backend/.env.local` e preencha as variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
SITE_URL=http://localhost:3000
FRONTEND_URL=http://127.0.0.1:5173
```

O arquivo `.env.local` é privado e não deve ser enviado ao repositório. As chaves ficam no servidor.

**Terminal 1 — servidor (`cd backend`):**

```sh
cd backend
npm ci
npm run dev -- --port 3000
```

**Terminal 2 — interface:**

```sh
cd frontend
npm ci
npm run dev
```

Abra [http://127.0.0.1:5173](http://127.0.0.1:5173). Mantenha os dois terminais abertos. A instalação com `npm ci` é necessária no primeiro uso ou quando as dependências forem alteradas.

No Windows, `INICIAR-ELOSOCIAL.cmd` também inicia os dois serviços. Não execute o arquivo se os servidores já estiverem abertos.

O Vite encaminha as chamadas `/api` para o servidor na porta 3000 apenas durante o desenvolvimento local.

## Publicar na Vercel

O frontend e o backend são dois projetos da Vercel conectados ao mesmo repositório:

| Configuração na Vercel | Projeto frontend | Projeto backend |
|---|---|---|
| Git Repository | Este mesmo repositório | Este mesmo repositório |
| Root Directory | `frontend` | `backend` |
| Framework Preset | Vite | Next.js |
| Install Command | `npm ci` | `npm ci` |
| Build Command | `npm run build` | `npm run build` |
| Output Directory | `dist` | Padrão do Next.js |
| Node.js | 22.x | 22.x |

Importe o mesmo repositório duas vezes na Vercel, dando um nome diferente a cada projeto e definindo o **Root Directory** conforme a tabela. Cada pasta possui seu próprio `package.json`, lock de dependências e `vercel.json`; nenhuma precisa dos arquivos da outra para compilar. Os comandos da raiz são atalhos para desenvolvimento e verificação local.

- **Frontend:** diretório raiz `frontend`, Vite, comando `npm run build`, saída `dist`. O arquivo `frontend/vercel.json` encaminha `/api` ao backend e mantém as rotas da interface acessíveis por endereço direto. Se o projeto usar a raiz do repositório, `vercel.json` na raiz define o comando e a saída `frontend/dist`.
- **Backend:** diretório raiz `backend`, Next.js. Configure as variáveis de `backend/.env.example` no projeto da Vercel. Para os endereços atuais, `SITE_URL=https://elo-social-api-jpbraga.vercel.app` e `FRONTEND_URL=https://elo-social-web-jpbraga.vercel.app`.

O frontend usa `/api` no mesmo domínio; ele não precisa de uma variável `SITE_URL`. O endereço do backend está no encaminhamento do `vercel.json`. O arquivo `backend/.env.local` serve apenas ao desenvolvimento local e não é enviado ao Git.

Se o backend for recriado com outro domínio, atualize `destination` da regra `/api/:caminho*` em `frontend/vercel.json` com o novo endereço e publique novamente o frontend. Atualize também a cópia dessa regra em `vercel.json` na raiz, mantida para compatibilidade com a publicação antiga pela raiz do repositório. Não encaminhe o frontend diretamente ao Supabase.

Configure as três chaves do Supabase somente no projeto **backend**, além de `SITE_URL` com a URL do novo backend e `FRONTEND_URL` com a URL do frontend. No Supabase Auth, autorize os retornos `/confirmar-email` e `/redefinir-senha` no domínio do frontend. Depois do deploy, confira `https://DOMINIO-DO-BACKEND/api/saude` e `https://DOMINIO-DO-FRONTEND/api/saude`; ambos devem retornar `{"situacao":"ok"}`. O segundo endereço também verifica o encaminhamento da API.

Se `SITE_URL` ou `FRONTEND_URL` não estiverem definidas, o backend usa os endereços oficiais acima em produção e os endereços locais em desenvolvimento. Esses mesmos valores controlam a lista de origens permitidas e os links de confirmação/recuperação. Uma variável explicitamente configurada tem prioridade. Alterações neste código só afetam o site hospedado após um novo deploy do backend.

## Banco de dados

Para usar o banco já configurado pela equipe, basta preencher o `.env.local`. Não é necessário executar novamente os scripts de criação.

Em um projeto Supabase novo, execute no SQL Editor, nesta ordem:

1. `backend/supabase/migrations/0001_esquema.sql`.
2. `backend/supabase/migrations/0002_crud_completo.sql`.
3. Opcionalmente, `backend/supabase/seed.sql`, com dados públicos de duas associações reais e projetos divulgados nos sites oficiais. Os registros entram como pendentes para a equipe aprovar no painel.

As instruções para preparar as contas de demonstração estão em `backend/supabase/preparar-demonstracao.sql`. A conta de gestor de teste fica sem vínculo permanente; o ensaio integrado cria uma ONG temporária e limpa os dados depois.

## Funcionalidades

- Mapa de Fortaleza com marcadores e acesso aos perfis.
- Catálogo com busca por nome, bairro e área de atuação.
- Perfil público com informações, contato e projetos.
- Solicitação de inclusão de uma instituição para análise.
- Cadastro de acesso, entrada na conta, recuperação de senha e saída.
- Painel do gestor para editar a instituição e criar, editar ou remover projetos.
- Painel administrativo para aprovar ou rejeitar ONGs e vincular gestores em cadastros antigos.

A solicitação de inclusão exige uma conta confirmada e aberta. A ONG é vinculada automaticamente ao gestor e aparece no painel como **Em verificação**. A equipe decide no painel `/admin` se publica ou rejeita a ONG.

Publicar uma associação com dados obtidos em fontes públicas não confirma vínculo institucional: o painel mantém a opção **Dados públicos conferidos; vínculo não confirmado** por padrão. Só escolha a opção de vínculo confirmado depois de comprová-lo com a instituição.

## Regras dos cadastros

- **CNPJ da ONG:** obrigatório, com 14 dígitos e dígitos verificadores válidos. A tela insere pontos, barra e hífen enquanto a pessoa digita; o servidor guarda somente os números. Um CNPJ já cadastrado é recusado.
- **Celular da conta e contato telefônico da ONG:** DDD de dois dígitos seguido de celular com nove dígitos, começando por 9. A tela mostra `(85) 99999-1234`; o servidor também confere o número. O contato da ONG pode ser um e-mail válido em vez do celular.
- **Nomes:** nome da instituição, responsável, bairro, endereço e nome do projeto recebem iniciais maiúsculas; palavras de ligação como “de” e “da” permanecem minúsculas. A descrição começa com maiúscula. O e-mail é mostrado em minúsculas.
- **Site:** a tela mantém `https://` visível e recebe apenas o restante, como `exemplo.org.br`. Os campos de texto perdem espaços extras nas pontas ao sair deles.
- **Outras exigências:** área de atuação deve ser uma das opções do formulário; descrição da ONG tem de 20 a 1.000 caracteres; referências públicas têm de 10 a 1.000. A senha da conta exige ao menos oito caracteres, uma letra e um número, e a confirmação deve coincidir.

Não há campo de CPF na aplicação. As máscaras ajudam no preenchimento, mas as regras do servidor continuam valendo para chamadas feitas sem a interface.

## API

A documentação está em [http://localhost:3000/docs](http://localhost:3000/docs). A coleção `backend/EloSocial.colecao-postman.json` pode ser importada no Postman.

| Operação | Endpoint |
|---|---|
| Listar instituições | `GET /api/ongs` |
| Consultar perfil e projetos | `GET /api/ongs/:id` |
| Solicitar inclusão | `POST /api/cadastro` |
| Criar acesso | `POST /api/auth/registrar` |
| Entrar e sair | `POST /api/auth/login`, `POST /api/auth/logout` |
| Consultar sessão | `GET /api/auth/me` |
| Recuperar acesso | `POST /api/auth/recuperar-senha`, `POST /api/auth/confirmar-recuperacao`, `POST /api/auth/redefinir-senha` |
| Confirmar e-mail | `POST /api/auth/confirmar-email` |
| Consultar, editar e remover a própria instituição | `GET`, `PATCH`, `DELETE /api/painel` |
| Listar e criar projetos | `GET`, `POST /api/painel/projetos` |
| Editar e remover projeto | `PATCH`, `DELETE /api/painel/projetos/:id` |
| Revisar ONGs e vincular gestor | `GET /api/admin/ongs`, `PATCH /api/admin/ongs/:id`, `POST /api/admin/ongs/:id/gestor` |

Requisições que alteram dados exigem o cabeçalho `Origin` correspondente ao `SITE_URL`. A coleção do Postman já contém essa configuração. Na interface local, o encaminhamento do Vite faz essa ligação.

As rotas protegidas utilizam a sessão em cookie HttpOnly. As regras do banco restringem as alterações à instituição vinculada ao gestor. Situação, CNPJ, verificação e posição no mapa são controlados pela equipe.

## Recuperação de senha

No projeto Supabase atual, os dois retornos abaixo já estão autorizados em **Authentication → URL Configuration → Redirect URLs**. Em outro projeto, cadastre-os antes de testar:

```text
http://127.0.0.1:5173/redefinir-senha
http://127.0.0.1:5173/confirmar-email
```

Solicite e abra o endereço no mesmo navegador, usando o endereço da interface acima. O e-mail de cadastro retorna para `/confirmar-email` e abre a área da ONG; o de recuperação retorna para `/redefinir-senha`. O envio depende da configuração de e-mails do Supabase e deve ser ensaiado com uma conta de e-mail acessível.

Para cadastrar pessoas fora da equipe do projeto e repetir os testes de e-mail, configure um servidor SMTP próprio em **Supabase → Authentication → SMTP Settings**. O envio padrão do Supabase aceita somente endereços autorizados da equipe e tem limite de duas mensagens por hora por projeto. São necessários endereço e nome do remetente, servidor, porta, usuário e senha SMTP. Depois de salvar, confira também o limite de envio em **Authentication → Rate Limits** e repita o cadastro e a recuperação com uma caixa de entrada acessível. Não coloque a senha SMTP neste repositório.

## Estrutura para apresentação

- `frontend/src/Aplicacao.jsx`: navegação e rotas do React.
- `frontend/src/paginas/`: telas de descoberta, cadastro, autenticação, painel do gestor e administração.
- `frontend/src/componentes/`: componentes reutilizáveis dos formulários e da identidade das ONGs.
- `frontend/src/utilitarios/`: máscaras de CNPJ e telefone e valores compartilhados.
- `frontend/publico/`: imagens exibidas pela interface.
- `backend/app/api/`: rotas HTTP do servidor, separadas por cadastro, autenticação, painel e administração.
- `backend/biblioteca/`: validação, conexão com Supabase e respostas da API.
- `backend/supabase/migrations/`: esquema e regras de acesso do banco.
- `backend/rotinas/`: tarefas manuais de importação e ensaio do fluxo.
- `backend/testes/`: verificações da API e das regras de validação.

O explorador do VS Code oculta dependências, compilações e arquivos gerados por meio de `.vscode/settings.json`. O Next.js exige as pastas `app/api` e arquivos `route.ts` para as rotas do servidor.

## Verificações

Para retomar o trabalho e consultar as pendências conhecidas, veja [docs/RETOMADA.md](docs/RETOMADA.md).

Com as dependências dos dois projetos instaladas, execute na raiz:

```sh
npm run diagnostico
npm run verificar
```

O diagnóstico verifica os pré-requisitos sem exibir credenciais. A verificação executa os testes, as compilações e a checagem de tipos; os fluxos reais com Supabase são ensaiados separadamente.

Dentro de `backend/`:

```sh
npm test
npm run typecheck
```

Para ensaiar o fluxo completo com registros temporários no Supabase, ligue o servidor na porta 3000 e, em outro PowerShell, execute:

```powershell
$env:ELOSOCIAL_TESTE_INTEGRACAO='1'
npm run testar:fluxo
```

O ensaio usa a conta `admin@demo.org` preparada em `backend/supabase/preparar-demonstracao.sql`. Ele confere pedido, vínculo, aprovação, recusa, acesso do gestor, projetos, confirmação por link, recuperação e troca de senha; depois remove os registros de teste e verifica a limpeza. A confirmação de entrega do e-mail real depende do serviço de envio do Supabase. Quando o serviço atingir seu limite temporário, o ensaio cria uma conta temporária sem enviar e-mail e usa links gerados pelo Supabase para verificar as etapas seguintes.

Para preparar o catálogo de apresentação no banco atual, com o servidor ligado na porta 3000, execute uma vez em `backend/`:

```powershell
$env:ELOSOCIAL_PREPARAR_APRESENTACAO='1'
npm run preparar:apresentacao
```

A rotina envia duas associações reais pela API de cadastro, deixa seus cartões em **Em verificação** para a decisão ao vivo no painel administrativo, adiciona projetos descritos nos sites oficiais e remove somente os seis exemplos fictícios identificados no código. As coordenadas sugeridas são aproximadas e devem ser conferidas antes da aprovação. A rotina pode ser repetida sem duplicar os dados ou desfazer decisões já tomadas no painel.

Para compilar a interface:

```sh
cd frontend
npm run build
```

## Dados e escopo

Os registros do `seed.sql` são baseados em [fontes públicas da Associação Peter Pan](https://www.app.org.br/) e da [Associação Projeto Frente Beneficente para a Criança](https://www.frentebeneficente.org.br/). Os marcadores foram obtidos por busca dos endereços no OpenStreetMap/Nominatim e são aproximados. O Projeto Reviva também foi incluído com base no seu site público, com verificação institucional pendente. A presença no catálogo não implica parceria, representação ou confirmação de vínculo com essas instituições.

Esta versão não inclui pagamentos, inscrições de voluntários ou relatórios. A aplicação está preparada para execução local; sua publicação exige configuração de hospedagem. Os bloqueios por número de tentativas da aplicação foram removidos; o provedor de autenticação ainda pode aplicar limites próprios.
