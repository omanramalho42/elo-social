# EloSocial - Back-end (API)

Next.js (rotas de API) + Supabase (PostgreSQL + Auth). Só back-end: documentado e testável pelo **Swagger** (`/docs`) e pelo **Postman**.

## Como rodar (local)
1. Crie um projeto gratuito no Supabase. No SQL Editor rode, em ordem: `supabase/migrations/0001_schema.sql`, `0002_crud_completo.sql` e (opcional) `supabase/seed.sql`.
2. Copie `.env.example` para `.env.local` e preencha as chaves (Settings > API). `SITE_URL` = `http://localhost:3000`.
3. `npm install` e `npm run dev`. Testes: `npm test`. Tipos: `npm run typecheck`.
4. Primeiro admin: crie o usuário em Authentication e rode o `insert into perfis ... 'admin'` do fim do `seed.sql`.
5. Para testar rápido, desligue "Confirm email" em Authentication > Providers > Email (em produção, deixe ligado).

## Swagger e Postman
- **Swagger:** abra http://localhost:3000/docs (especificação em `/api/openapi`). Use "Try it out".
- **Postman:** Import > cole `http://localhost:3000/api/openapi`. Na coleção, aba Headers, adicione `Origin: http://localhost:3000` (igual ao `SITE_URL`). Sem isso, POST/PATCH/DELETE dão 403 (proteção CSRF). O Postman guarda o cookie do login sozinho.

- **Coleção pronta:** importe `EloSocial.postman_collection.json` no Postman. Ela já traz o cabeçalho `Origin`, as variáveis e os pedidos na ordem da apresentação (João Pedro, Oman, Heitor, Enoque, Evandro).
- **Preparar a demonstração:** rode `supabase/demo_setup.sql` (instruções dentro do arquivo) para ter um gestor e um admin de teste.

## Fluxo (igual ao protótipo do Figma)
1. **Cadastrar ONG** (`POST /api/cadastro`): envia para conferência. Não publica e não cria acesso.
2. **Área da ONG > Cadastre-se** (`POST /api/auth/registrar`): o gestor cria a conta (nome, e-mail, telefone, senha).
3. A **equipe** confere, publica a ONG (`PATCH /api/admin/ongs/:id`, com a posição no mapa) e vincula o gestor (`POST /api/admin/ongs/:id/gestor`).
4. O gestor entra (`POST /api/auth/login`) e gerencia a ONG e os projetos no painel.

## Rotas
| Tela do protótipo | Rota | Quem |
|---|---|---|
| Mapa e Catálogo | GET `/api/ongs?q=&area=&pagina=&limite=` | público |
| Perfil da ONG | GET `/api/ongs/:id` | público |
| Cadastrar ONG | POST `/api/cadastro` | público |
| Área da ONG > Cadastre-se | POST `/api/auth/registrar` | público |
| Área da ONG > Entrar | POST `/api/auth/login` · POST `/api/auth/logout` · GET `/api/auth/me` | — |
| Esqueci minha senha | POST `/api/auth/recuperar-senha` · POST `/api/auth/redefinir-senha` | público / logado |
| Painel: dados da ONG | GET · PATCH · DELETE `/api/painel` | gestor |
| Painel: projetos | GET · POST `/api/painel/projetos` · PATCH · DELETE `/api/painel/projetos/:id` | gestor |
| Conferência/publicação | GET `/api/admin/ongs?status=` · PATCH · DELETE `/api/admin/ongs/:id` | equipe |
| Vínculo do gestor | POST · DELETE `/api/admin/ongs/:id/gestor` | equipe |

### CRUD completo
| | Create | Read | Update | Delete |
|---|---|---|---|---|
| ONGs | POST `/api/cadastro` | GET `/api/ongs`, `/api/ongs/:id`, `/api/painel` | PATCH `/api/painel`, PATCH `/api/admin/ongs/:id` | DELETE `/api/painel`, DELETE `/api/admin/ongs/:id` |
| Projetos | POST `/api/painel/projetos` | GET `/api/painel/projetos`, `/api/ongs/:id` | PATCH `/api/painel/projetos/:id` | DELETE `/api/painel/projetos/:id` |

Erros: `{ "erro": "...", "detalhes": [...] }` (422 validação, 401 sem login, 403 sem permissão, 404, 409, 429).

## Segurança (resumo)
- **RLS em todas as tabelas**: o público só vê ONGs aprovadas; o gestor só mexe na ONG vinculada a ele; um gatilho do banco impede o gestor de mudar status, verificação, CNPJ, dono e posição.
- **Responsável e referências** do pedido ficam em tabela privada (`ongs_privado`), só a equipe lê. O CNPJ é público (como no perfil do protótipo).
- Validação com Zod em toda entrada (campos extras são recusados; CNPJ com dígito verificador; "site" só aceita https:// ou @perfil).
- Login com mensagem única, limite de tentativas, cookie httpOnly/secure/sameSite, checagem de origem (CSRF), cabeçalhos de segurança, erros sem detalhes internos, recuperação de senha sem revelar se o e-mail existe.

## Limitações conhecidas
- Não consegui ver a tela logada do protótipo (depois do login). O painel foi feito com base em "atualizar informações e projetos da instituição vinculada ao perfil". Se houver mais campos ou ações lá, é só acrescentar.
- O limite de tentativas é em memória; em produção use Upstash/Redis.
- A posição no mapa é definida pela equipe ao publicar (sem geocodificação).
- O envio do e-mail de recuperação depende de configurar o e-mail no Supabase.
- Dados do `seed.sql` são demonstrativos (posições aproximadas).
