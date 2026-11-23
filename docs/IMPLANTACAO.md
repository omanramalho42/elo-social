# Implantação do EloSocial

Atualização de 23/11/2026.

## Ambientes publicados

| Componente | Hospedagem | Endereço |
|---|---|---|
| Frontend React e Vite | Vercel | https://elo-social-web-jpbraga.vercel.app |
| API Next.js | Render | https://elo-social-api-jpbraga.onrender.com |
| Documentação da API | Render | https://elo-social-api-jpbraga.onrender.com/docs |
| Banco e autenticação | Supabase | Projeto existente da equipe |

O frontend usa `/api` no próprio domínio. Os arquivos `frontend/vercel.json` e `vercel.json` encaminham essas requisições ao Render. Confirmação de e-mail e recuperação de senha são enviadas exclusivamente pelo Supabase Auth. O backend apenas solicita essas operações ao Auth.

## Configuração do backend

- Repositório: `omanramalho42/elo-social`, branch `main`.
- Serviço Render: `elo-social-api-jpbraga`.
- Root Directory: `backend`.
- Build: `npm ci --include=dev && npm run build`.
- Start: `npm run start -- --hostname 0.0.0.0 --port $PORT`.
- Health Check: `/api/saude`.
- `SITE_URL`: domínio público da API no Render.
- `FRONTEND_URL`: domínio público do frontend na Vercel.
- As três variáveis Supabase ficam nas configurações privadas do serviço; seus valores não devem ser versionados.

O commit `dc91d6d` atualizou os dois encaminhamentos e o endereço padrão de produção do backend. O teste de origem também passou a rejeitar o domínio antigo quando as URLs não são explicitamente configuradas.

O painel do Render comprovou **Auto-Deploy** do commit `dc91d6d`, com resultado **Live**, no deploy `dep-dc2863nlk1mc73atb690`. Esse resultado foi observado no serviço existente; não implica que todo serviço criado a partir de um URL público tenha integração automática com o Git.

## Verificações executadas

- `npm run verificar`: 25 testes aprovados, builds dos dois projetos e checagem TypeScript.
- Regressão de endereços: a configuração antiga falhou no teste novo; a configuração do Render passou.
- API direta e encaminhamento pelo frontend: saúde, catálogo, documentação e restrições de acesso conferidos. As respostas pelo site identificaram o Render como servidor de origem.
- Contas existentes de admin e gestor: login, consulta da sessão, acesso ao painel correspondente e logout passaram. A conta de gestor permaneceu em sua situação original, pendente.
- Ensaio integrado publicado: 44 verificações HTTP passaram com registros descartáveis. Cobriu solicitação, aprovação, recusa, edição da instituição, projetos, permissões, recuperação por link técnico, troca de senha da conta descartável e exclusões.
- Contas, pedidos e projetos do ensaio foram removidos, com conferência da limpeza. Nenhum registro institucional preexistente foi alterado.

O ensaio não enviou e-mails. O recebimento real de confirmação e recuperação não foi comprovado por essas verificações. A configuração atual do Auth utiliza o envio padrão do Supabase; o SMTP próprio estava desativado na consulta ao painel.

## Pendências externas

### Git do frontend

A Vercel mantém o frontend publicado, mas a tentativa de conectar `omanramalho42/elo-social` foi recusada. O projeto ainda aparece como **Git Repository Not connected**. A decisão entre obter autorização do proprietário para a integração ou usar um fork na conta responsável pela hospedagem permanece pendente. A publicação já realizada pela CLI continua funcionando.

### API antiga na Vercel

A API antiga ainda estava ativa na última conferência. A CLI exige confirmação manual para pausar o projeto `elo-social-api-jpbraga`. Um terminal foi preparado para o titular digitar o nome do projeto. A pausa só deve ser registrada como concluída após a confirmação e a verificação do domínio antigo.

### Entrega dos e-mails do Auth

Para comprovar o recebimento, é necessária uma caixa de entrada acessível associada a uma conta de teste autorizada. Solicitar apenas um envio de confirmação ou recuperação e conferir o retorno ao domínio público do frontend. Interromper o teste se o Supabase retornar limite temporário; não repetir automaticamente.

## Revalidação após publicações

Conferir `/api/saude` diretamente no Render e pelo domínio do site. Ambos devem responder `{"situacao":"ok"}`. Validar uma sessão de gestor e uma de administrador com as permissões esperadas. As credenciais, cookies e links de autenticação nunca devem aparecer em commits ou registros de teste.

O serviço atual usa o plano gratuito do Render e pode aguardar a inicialização após períodos de inatividade.
