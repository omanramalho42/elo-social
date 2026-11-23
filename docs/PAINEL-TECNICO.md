# Painel técnico do EloSocial

Acesse `/health` na interface ou pressione **Shift + S** fora de campos de digitação. O atalho não intercepta edição de texto, composição de caracteres ou combinações com Ctrl, Alt e Meta. Há navegação por seções e filtros por função, área da aplicação, operação e método HTTP.

O painel reúne 43 funcionalidades numeradas em cinco grupos e as 29 operações HTTP documentadas, incluindo a consulta de localização. Identifica recursos que existem somente na API. A numeração é um identificador, não uma pontuação de qualidade nem uma comprovação de teste funcional. O inventário online deriva do OpenAPI do backend. Quando a consulta falha, o catálogo local permanece acessível e é identificado como referência do código.

## Consulta de disponibilidade

`GET /api/saude/detalhes` é público e não recebe credenciais de usuário. Faz duas sondagens paralelas, com prazo de cinco segundos por dependência: leitura pública sem linhas da tabela `ongs` e saúde do Supabase Auth. Retorna disponibilidade, duração das sondagens, horário da consulta, origens públicas, versões e commit/branch disponibilizados pela hospedagem. Uma dependência indisponível resulta em relatório parcial com HTTP 503, sem mensagens internas ou segredos. Não exibe registros, senhas, tokens, chaves ou variáveis privadas. A rota básica `/api/saude` mantém seu contrato e a configuração do Render.

A interface aguarda até 65 segundos para permitir a inicialização do Render gratuito, cancela consultas ao sair e oferece atualização manual. Não há polling periódico. A data de compilação do frontend não é apresentada como data do deploy do backend. Metadados não fornecidos pelo ambiente são identificados como ausentes.

## Escopo

A aba **Desempenho**, em `/health?aba=desempenho`, apresenta o relatório estático do último ensaio local isolado, mapa de calor de P95/erros por concorrência e rota, detalhes das células e projeção de chamadas por segundo para 50 milhões de usuários ou outro volume informado. A projeção não é um teste executado. O botão de atualização apenas relê o JSON; não inicia carga. A rotina `npm run testar:carga` não aceita alvos externos e usa Supabase/PostgREST simulado em loopback, sem credenciais reais. Consulte `docs/TESTE-DE-CARGA.md` para condições e resultados.

Inclui deploys, fluxo navegador → Vercel → Render → Supabase, tecnologias, tabela de operações com acesso, integrações e estrutura das tabelas. Supabase Auth responde exclusivamente pelos e-mails de confirmação e recuperação; não há serviço de e-mail próprio no backend. Photon faz busca de endereço na administração; OpenStreetMap fornece tiles; Google Fonts e jsDelivr são recursos de interface/documentação. Nominatim permanece apenas como referência histórica da preparação dos dados, sem chamadas de execução.

O diagnóstico não executa cadastro, aprovação, exclusão, login ou envio de e-mail. Não verifica todas as permissões, entrega de e-mail, RLS implantada ou funcionamento de ponta a ponta. A existência de uma rota no inventário não significa que ela foi executada durante a consulta.

## Verificação

Testes cobrem metadados sem vazamento de segredos, erros de sondagem sanitizados, unicidade e acesso do inventário, regras do atalho, localização e geocodificação. A correspondência entre o catálogo da interface e todas as operações OpenAPI foi conferida em ensaio separado, sem acoplar os builds. A especificação é validada pelo Swagger Parser. A interface foi inspecionada em desktop e largura de 390 px, com filtros e atalho no navegador. Resultados e publicação são registrados em `RETOMADA.md`.
