# Retomada do EloSocial

## Recuperação de senha — pendência no Supabase Auth

O usuário recebeu o e-mail, mas o link terminou em localhost. Diagnóstico sem e-mail, com token explicitamente inválido: `/auth/v1/verify` recebeu `redirect_to=https://elo-social-web-jpbraga.vercel.app/redefinir-senha` e respondeu 303 para `http://localhost:3000/`. Nenhum token real foi usado ou registrado. Corrigir URL Configuration do Supabase: Site URL do frontend atual e Redirect URLs exatas para `/redefinir-senha` e `/confirmar-email`, preservando retornos locais necessários. O painel Supabase exigiu login; nenhuma configuração foi alterada. Após o ajuste, solicitar novo e-mail e validar no mesmo navegador.

## Publicação na conta própria — jpbraga-dev

Publicados via Vercel CLI, com autorização do usuário, dois projetos a partir das respectivas pastas locais:

- Site: `https://elo-social-web-jpbraga.vercel.app`, projeto `elo-social-web-jpbraga`.
- API: `https://elo-social-api-jpbraga.vercel.app`, projeto `elo-social-api-jpbraga`.

As três credenciais Supabase foram cadastradas no ambiente Production do backend após confirmação específica do usuário. A service role foi armazenada como Secret. URLs e chave anônima com prefixo NEXT_PUBLIC foram armazenadas como Config, conforme exigência da Vercel para esse prefixo. Nenhuma credencial foi exibida ou incluída no pacote de código; `.vercelignore` exclui arquivos de ambiente privados.

Verificações online aprovadas: site e `/catalogo` HTTP 200; saúde direta e pelo frontend com `{"situacao":"ok"}`; listagem com três instituições; recuperação com origem do novo site passou pela proteção e retornou 422 para corpo vazio, sem envio de e-mail. Navegador confirmou o catálogo com as três instituições. Login real e entrega de e-mails não foram repetidos nessa publicação. Retornos do Supabase Auth para o novo domínio precisam ser conferidos antes de validar confirmação/recuperação por e-mail real.

A integração do GitHub da nova conta não conseguiu vincular `omanramalho42/elo-social`. A publicação atual foi feita a partir do código local; não foi criada cópia do repositório. Pushes no GitHub ainda não publicam automaticamente nestes dois projetos. Para isso, o responsável pelo repositório deverá autorizar a integração apropriada. Os projetos CLI usam a pasta enviada como raiz (`.`), com framework definido no respectivo `vercel.json`.

## Novos endereços da hospedagem

O usuário informou `https://elo-social-backend.vercel.app` e `https://elo-social-frontend.vercel.app`. A consulta confirmou API `/api/ongs` e documentação `/docs` do novo backend com HTTP 200 e a origem do novo frontend aceita na recuperação (corpo vazio rejeitado por validação 422, sem envio de e-mail). O redirecionamento de páginas do backend para o frontend é previsto em `app/[[...caminho]]/page.tsx`.

O frontend publicado ainda encaminhava `/api` ao backend antigo removido, retornando `DEPLOYMENT_NOT_FOUND`. Os dois rewrites versionados e os endereços padrão do backend foram atualizados localmente para os novos domínios, junto dos exemplos e testes. Precisam ser enviados ao GitHub e publicados. A rota `/api/saude` do backend novo retornou 404 na consulta: confirmar que seu projeto está publicando o commit atual, que inclui essa rota. Não foi alterada configuração de Vercel nem de Supabase nesta etapa.

## Deploys separados no mesmo repositório

Conforme orientação do usuário, manter um único repositório com dois serviços independentes: Vite em `frontend/` e Next.js em `backend/`. Ambos possuem configuração Vercel, manifestos e locks próprios. A importação do frontend pelo ensaio do backend foi removida; o gerador de CNPJ temporário agora fica em `backend/rotinas/apoio/`.

Na Vercel, importar o mesmo repositório em dois projetos, com Root Directory `frontend` e `backend`, respectivamente. A configuração da raiz permanece apenas como compatibilidade para o frontend antigo. Se a API ganhar outro domínio, atualizar o encaminhamento no frontend e as URLs de ambiente do backend antes de testar autenticação. O README contém a tabela de configuração e a conferência via `/api/saude`. Nenhum projeto da Vercel foi criado ou alterado nesta etapa.

Verificação desta separação: gerador local de dados temporários conferido; nenhuma referência relativa entre as duas pastas encontrada; `npm run verificar` aprovado com 25 testes, build dos dois serviços e TypeScript do backend. O ensaio com escrita no Supabase não foi repetido para essa alteração de organização.

Registro de 11/11/2026 para permitir continuar o projeto sem depender do chat anterior.

## Contexto recuperado

Plataforma acadêmica de ONGs e projetos sociais de Fortaleza. O README contém instalação, regras de negócio, endpoints e publicação. O código usa React 18/Vite 5 no frontend, Next.js 14 no backend e Supabase para PostgreSQL e autenticação. Os perfis são visitante, gestor (`ong`) e administrador (`admin`).

Ponto inicial: branch `main`, commit `0bc5786`, sem alterações locais. O histórico de chats Codex disponível não trouxe o chat anterior; este documento foi reconstruído a partir do repositório e de verificações locais.

## Ambiente recuperado

- Inicialmente, apenas o Node do runtime do Codex estava disponível e o npm foi usado temporariamente para o primeiro diagnóstico.
- Ambiente permanente instalado para o usuário: Node 22.23.5 e npm 10.9.9 em `%LOCALAPPDATA%\Programs\EloSocial\node-v22.23.5-win-x64`, com PATH do usuário atualizado. Download obtido de `nodejs.org` e SHA256 conferido contra `SHASUMS256.txt`. Abra um novo terminal para carregar o PATH atualizado; não precisa reiniciar o PC.
- Dependências de frontend e backend instaladas com `npm ci`, preservando os locks.
- `backend/.env.local` configurado com o arquivo fornecido pelo usuário em 11/11/2026. O original em Downloads foi preservado. A cópia local usa `SITE_URL=http://localhost:3000` e `FRONTEND_URL=http://127.0.0.1:5173`. Nenhuma credencial foi registrada neste documento.
- O Git ignora `backend/.env.local`; diagnóstico atual aprovado com zero pendências. Em outra máquina, use o modelo e configure suas credenciais em arquivo privado.

Na raiz, `npm run diagnostico` aponta dependências e configuração ausentes sem exibir credenciais. `npm run verificar` executa testes, build do servidor, checagem de tipos e build da interface; para no primeiro erro. Nenhum desses comandos executa as rotinas de escrita no banco.

## Linha de base

- Backend: 15 testes aprovados (validação, origens e documentação OpenAPI).
- Frontend: 3 testes aprovados (máscaras e formatação).
- TypeScript do backend: aprovado.
- Build do frontend: aprovado.
- Build do backend: aprovado sem credenciais locais; isso valida compilação, não acesso ao banco.
- Comando conjunto `npm run verificar`: aprovado, incluindo os 18 testes, os dois builds e a checagem de tipos.
- Diagnóstico inicial: retornou código 1 conforme esperado. Após criar o modelo, as chaves ilustrativas continuam sendo sinalizadas como pendentes.
- Dependências reinstaladas e comando conjunto repetido com o Node/npm permanentes: aprovado.
- Após o fornecimento do arquivo de ambiente, API e interface foram iniciadas em sessões de terminal. Frontend em `http://127.0.0.1:5173`; API em `http://127.0.0.1:3000`. Inicialização confirmada, superando a pendência do ensaio anterior.
- Verificações HTTP aprovadas: interface e catálogo (200), encaminhamento `/api/openapi` pelo Vite (200), catálogo Supabase com três instituições (200), perfil público (200) e documentação `/docs` (200).
- Proteções verificadas sem sessão: `/api/auth/me`, `/api/painel` e `/api/admin/ongs` retornaram 401; filtro `pagina=0` retornou 422; POST com origem externa diretamente na API retornou 403. No desenvolvimento, o Vite reescreve Origin, por isso a checagem de rejeição de origem foi realizada diretamente na porta 3000.
- Chave administrativa validada por consulta somente de leitura à tabela `ongs`. Nenhum registro do banco foi criado, alterado ou removido nesta configuração.
- Login com conta real, envio de e-mail, operações autenticadas dos painéis e revisão visual no navegador: ainda não executados nesta retomada.

Passar nos testes atuais não comprova todos os comportamentos da aplicação.

## Pendências de dependências

Auditoria `npm audit` de 11/11/2026, antes de qualquer atualização:

| Projeto | Críticas | Altas | Moderadas | Baixas | Total de pacotes sinalizados |
|---|---:|---:|---:|---:|---:|
| Backend | 1 | 2 | 2 | 2 | 7 |
| Frontend | 0 | 4 | 1 | 0 | 5 |

Next.js foi classificado como crítico. Backend também sinalizou PostCSS, Zod, Supabase e ferramentas de desenvolvimento; frontend sinalizou React Router, Vite e esbuild. A auditoria inclui dependências transitivas e ferramentas; a exposição de cada alerta deve ser analisada. Os números podem mudar com o registro de novos avisos. Atualizações não foram aplicadas nesta preparação.

## Roteiro de revisão funcional

As verificações HTTP acima cobrem apenas parte do roteiro abaixo; a revisão completa de interface e fluxos autenticados continua pendente. Registre passos, resultado esperado, resultado obtido e evidência para cada falha.

| Área | Conferir |
|---|---|
| Mapa e catálogo | Apenas ONGs aprovadas; marcadores; filtros por nome, bairro e área; paginação; estados vazios e erro de conexão. |
| Perfil público | Dados, projetos, contatos, site e identificação inexistente. |
| Contas e sessão | Cadastro, confirmação de e-mail, login, logout, recarga da página e distinção entre gestor e admin. |
| Recuperação de senha | Solicitação, entrega real, retorno autorizado, link expirado e troca de senha. |
| Solicitação de ONG | Conta confirmada; CNPJ válido e único; validações; vínculo automático; situação pendente. |
| Painel do gestor | Sem ONG, pendente, rejeitada e aprovada; edição dos campos permitidos e isolamento entre contas. |
| Projetos | Criar, editar e remover; validação de campos; limites; bloqueio de acesso a outra ONG. |
| Administração | Listagem; aprovar com coordenadas; rejeitar com motivo; verificação institucional e vínculo de gestor. |
| Exclusão | Confirmação; remoção de ONG/projetos/conta; erros parciais; verificar somente com dados descartáveis. |
| Publicação | Encaminhamento `/api`, acesso direto às páginas, cookies, origens e URLs de retorno por ambiente. |

## Ordem para continuar

Conforme orientação posterior do usuário, preparar ferramentas e verificações primeiro e deixar o `.env` para o final. A instalação local e as verificações de compilação já foram concluídas.

1. Revisar o código e priorizar falhas sem depender do banco.
2. Tratar os alertas de dependências com versões compatíveis e repetir a verificação local.
3. Iniciar API e interface e revisar os fluxos públicos no navegador.
4. Validar contas, permissões e painéis com dados descartáveis. O ensaio `backend/rotinas/testar-fluxo.mjs` existe, mas cria/remove registros e usa conta de demonstração; leia-o antes de executar.
5. Validar e-mails reais e configuração da hospedagem.
6. Corrigir cada falha com reprodução e evidência de nova verificação, atualizando este arquivo.

Configuração e leitura do Supabase já confirmadas. Antes dos ensaios que alteram registros, confirmar qual banco é de teste e usar dados descartáveis.

## Comandos disponíveis

### Correção preparada para origem em produção

Em 11/11/2026 foi reproduzido, na hospedagem, o bloqueio 403 para a origem oficial do frontend em `/api/auth/recuperar-senha`; a origem do backend passou pela proteção e chegou à validação 422 usando corpo vazio, sem envio de e-mail.

O código local agora centraliza os endereços em `backend/biblioteca/enderecos.ts`. Quando uma variável de endereço está ausente, usa os domínios oficiais em produção e os locais em desenvolvimento. A proteção de origem, os links de confirmação/recuperação e o redirecionamento de páginas do backend usam a mesma configuração. Variáveis explícitas continuam tendo prioridade: uma variável preenchida incorretamente ainda precisa ser corrigida no ambiente de hospedagem.

Validação desta alteração: 17 testes do backend e checagem TypeScript aprovados, incluindo reprodução de produção sem `FRONTEND_URL`, rejeição de origens externas/ausentes e preservação de hospedagem alternativa. Não foi executado envio real de e-mail. Correção ainda não publicada; o usuário informou não ter acesso à Vercel. O deploy pode ocorrer pelo GitHub se a integração automática estiver configurada, ou pela pessoa responsável pela hospedagem. A versão hospedada não foi alterada.

Atualização: o commit `6785d3c` foi encontrado em `origin/main` com a correção e a preparação do ambiente. A compilação local do backend também passou. A consulta pública de status desse commit no GitHub mostrou `Vercel – elo-social` concluído e `Vercel – elo-social-6qwo` com falha de deploy (`dpl_6EirPy4CWTavzh3Ck8KpMXAhbP6o`). A API hospedada continua retornando 403 para o domínio oficial do frontend. A publicação automática existe, mas o backend corrigido ainda não entrou em produção. O motivo detalhado da falha não consta no status público; consultar os logs da Vercel com a conta responsável antes de atribuir uma causa.

Na raiz do repositório, em um novo terminal Windows:

```powershell
node --version
npm.cmd --version
npm.cmd run verificar
```

Para executar os serviços em dois terminais, quando chegar a etapa de configuração:

```powershell
npm.cmd run dev:api
```

```powershell
npm.cmd run dev:interface
```

Interface: `http://127.0.0.1:5173`. API: `http://localhost:3000`. Os comandos `.cmd` funcionam também em PowerShell com restrição de execução de scripts `.ps1`. O iniciador `INICIAR-ELOSOCIAL.cmd` agora confere npm e configuração antes de iniciar.
