# Teste de carga e aba Desempenho — Implementation Plan

> Execução sequencial nesta tarefa. O pedido do usuário autoriza implementar, executar os testes controlados e publicar a aba; não envolve contratação de infraestrutura.

**Goal:** medir tráfego concorrente da API em ambiente isolado e apresentar resultados e projeções de 50 milhões de usuários sem confundir as duas coisas.

**Architecture:** iniciar Next.js de produção em loopback com um simulador local de Supabase/PostgREST. Medir requisições GET com concorrência crescente, limites de tempo/volume e limpeza dos processos. Publicar somente agregados sem segredos em JSON estático e uma aba em `/health?aba=desempenho`.

**Tech Stack:** Node.js 22, HTTP/fetch nativos, Next.js existente, React/Vite e CSS do projeto.

## Restrições

- Nenhuma carga contra Vercel, Render, Supabase ou geocodificação em produção; sem cadastro, login, escrita ou e-mail.
- Gerador aceita apenas seu próprio alvo loopback; até 1.000 clientes HTTP concorrentes, 200.000 chamadas e três minutos.
- Banco, rede, RLS e CDN de produção não são medidos. Sem afirmar suporte real a 50 milhões de usuários.
- Cada amostra informa cenário, duração, total, erros, vazão e percentis; sem preencher resultados não executados.
- Repositórios/pastas continuam compilando independentemente; nenhuma credencial no relatório.

## Tarefas

1. **Gerador e métricas:** criar `rotinas/apoio/metricas-carga.mjs`, testes em `rotinas/testes/carga.teste.mjs` e `rotinas/testar-carga.mjs`. `resumirAmostras(amostras, duracaoMs)` devolve contadores, P50/P95/P99 e req/s. Testar percentis, amostra vazia, falhas e duração inválida. Executar contra o servidor isolado e salvar agregados em `frontend/publico/diagnosticos/carga.json`. Encerrar processos e conexões em `finally`, inclusive interrupção.
2. **Aba e projeção:** criar `frontend/src/paginas/Desempenho.jsx`, CSS e `utilitarios/desempenho.js`. `projetarDemanda(usuarios, chamadas, intervalo)` calcula chamadas/s e valida números finitos, sem inferir instâncias ou usuários suportados. Testar limites e números grandes. Adicionar aba com URL compartilhável, mapa de calor navegável por teclado, detalhes de célula, legenda, metodologia e acesso ao JSON. Não executar carga no navegador.
3. **Verificação e publicação:** executar testes de métricas, frontend e `npm run verificar`; conferir desktop, 390 px, tema claro/escuro, falha de relatório e navegação pelo Shift + S. Registrar cenário e limites na documentação/RETOMADA. Commit/push das alterações desta tarefa, deploy do frontend e conferência pública.

## Pontos de revisão

- Nenhuma amostra vazia pode aparecer como 0 ms ou sucesso.
- Timeouts e respostas não 200 entram na taxa de erro; erros internos não são publicados.
- Total e percentis derivam de medições reais; projeções têm entradas e unidades explícitas.
- Saturação do gerador e execução na mesma máquina limitam a interpretação.
- Interrupção não deixa processos locais abertos nem altera o ambiente Supabase existente.
