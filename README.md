# EloSocial

Plataforma acadêmica para divulgar ONGs e projetos sociais de Fortaleza. O visitante pode encontrar instituições no mapa, pesquisar no catálogo e conhecer suas iniciativas. O gestor pode atualizar os dados da instituição vinculada à sua conta e administrar seus projetos.

## Tecnologias

- Frontend: React e Vite.
- Backend: Next.js, com rotas de API executadas no Node.js.
- Banco de dados: PostgreSQL no Supabase.
- Autenticação: Supabase Auth.
- Mapa: Leaflet e OpenStreetMap.
- Documentação e testes da API: Swagger e Postman.

## Executar localmente

É necessário ter Node.js e npm instalados, além das credenciais do projeto Supabase da equipe.

Copie `.env.example` para `.env.local`, na raiz, e preencha as variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
SITE_URL=http://localhost:3000
FRONTEND_URL=http://127.0.0.1:5173
```

O arquivo `.env.local` é privado e não deve ser enviado ao repositório. As chaves ficam no backend.

**Terminal 1 — backend, na raiz do projeto:**

```sh
npm ci
npm run dev -- --port 3000
```

**Terminal 2 — frontend:**

```sh
cd frontend
npm ci
npm run dev
```

Abra [http://127.0.0.1:5173](http://127.0.0.1:5173). Mantenha os dois terminais abertos. A instalação com `npm ci` é necessária no primeiro uso ou quando as dependências forem alteradas.

No Windows, `INICIAR-ELOSOCIAL.cmd` também inicia os dois serviços. Não execute o arquivo se os servidores já estiverem abertos.

O Vite encaminha as chamadas `/api` para o backend na porta 3000. Esse encaminhamento está configurado para desenvolvimento local; a hospedagem precisa de configuração equivalente.

## Banco de dados

Para usar o banco já configurado pela equipe, basta preencher o `.env.local`. Não é necessário executar novamente os scripts de criação.

Em um projeto Supabase novo, execute no SQL Editor, nesta ordem:

1. `supabase/migrations/0001_schema.sql`.
2. `supabase/migrations/0002_crud_completo.sql`.
3. Opcionalmente, `supabase/seed.sql`, com os dados demonstrativos.

As instruções para preparar as contas de demonstração estão em `supabase/demo_setup.sql`. O gestor deve estar vinculado a uma ONG para acessar seu painel.

## Funcionalidades

- Mapa de Fortaleza com marcadores e acesso aos perfis.
- Catálogo com busca por nome, bairro e área de atuação.
- Perfil público com informações, contato e projetos.
- Solicitação de inclusão de uma instituição para análise.
- Cadastro de acesso, login, recuperação de senha e logout.
- Painel do gestor para editar a instituição e criar, editar ou remover projetos.

A solicitação de inclusão não publica a instituição automaticamente. A equipe utiliza as rotas administrativas para conferir os dados, publicar e vincular o gestor. O frontend ainda não possui painel administrativo.

## API

A documentação está em [http://localhost:3000/docs](http://localhost:3000/docs). A coleção `EloSocial.postman_collection.json` pode ser importada no Postman.

| Operação | Endpoint |
|---|---|
| Listar instituições | `GET /api/ongs` |
| Consultar perfil e projetos | `GET /api/ongs/:id` |
| Solicitar inclusão | `POST /api/cadastro` |
| Criar acesso | `POST /api/auth/registrar` |
| Entrar e sair | `POST /api/auth/login`, `POST /api/auth/logout` |
| Consultar sessão | `GET /api/auth/me` |
| Recuperar acesso | `POST /api/auth/recuperar-senha`, `POST /api/auth/confirmar-recuperacao`, `POST /api/auth/redefinir-senha` |
| Consultar, editar e remover a própria instituição | `GET`, `PATCH`, `DELETE /api/painel` |
| Listar e criar projetos | `GET`, `POST /api/painel/projetos` |
| Editar e remover projeto | `PATCH`, `DELETE /api/painel/projetos/:id` |

Requisições que alteram dados exigem o cabeçalho `Origin` correspondente ao `SITE_URL`. A coleção do Postman já contém essa configuração. No frontend local, o proxy do Vite faz o encaminhamento.

As rotas protegidas utilizam a sessão em cookie HttpOnly. As regras do banco restringem as alterações à instituição vinculada ao gestor. Status, CNPJ, verificação e posição no mapa são controlados pela equipe.

## Recuperação de senha

No Supabase, em **Authentication → URL Configuration → Redirect URLs**, autorize:

```text
http://127.0.0.1:5173/redefinir-senha
```

Solicite e abra o link no mesmo navegador, usando o endereço do frontend acima. O fluxo confirma o código do e-mail, permite definir a nova senha e retorna ao login. O envio depende da configuração de e-mails do Supabase e deve ser ensaiado com uma conta de e-mail acessível.

## Verificações

Na raiz:

```sh
npm test
npm run typecheck
```

Para compilar o frontend:

```sh
cd frontend
npm run build
```

## Dados e escopo

Os registros do `seed.sql` são demonstrativos e possuem posições aproximadas. O Projeto Reviva foi incluído com base em informações públicas do site oficial, com verificação institucional pendente e marcador aproximado na rua informada. A presença no catálogo não implica parceria com a instituição.

Esta versão não inclui pagamentos, inscrições de voluntários ou relatórios. A aplicação está preparada para execução local; sua publicação exige configuração de hospedagem. O limite de tentativas da API é mantido em memória e reinicia com o servidor.
