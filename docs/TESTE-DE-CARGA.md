# Ensaio de concorrência — 23/11/2026

O pedido de teste para 50 milhões ou mais foi tratado em duas partes: medição controlada local e projeção matemática identificada. **Não foram simulados nem comprovados 50 milhões de usuários reais simultâneos. Não foi medida a capacidade da produção.**

## Cenário medido

Next.js 16.4.6 em modo de produção, Node v22.23.5, máquina com 16 processadores lógicos e 16 GiB de RAM. Gerador, API e simulador compartilham o mesmo computador. O banco foi substituído por um servidor local compatível com as consultas PostgREST usadas, com 100 ONGs sintéticas e atraso configurado de 25 ms. Nenhuma chave real, dado privado, e-mail ou operação de escrita foi usado.

Rotas alternadas: `GET /api/ongs?limite=100`, `GET /api/ongs/1` e `GET /api/saude`. Uma chamada em voo por cliente HTTP, sem tempo de leitura entre ações. Cada etapa lança chamadas durante seis segundos e aguarda sua conclusão; a vazão usa o tempo completo, incluindo drenagem. P50/P95/P99 incluem sucessos e falhas. Timeout configurado de três segundos; o tempo efetivamente observado pode ultrapassá-lo sob bloqueio do gerador.

## Resultado observado

| Clientes HTTP concorrentes | Chamadas | Chamadas/s | P95 | Erros |
|---:|---:|---:|---:|---:|
| 1 | 137 | 22,82 | 50,97 ms | 0 |
| 10 | 1.151 | 190,70 | 67,80 ms | 0 |
| 50 | 2.199 | 362,03 | 186,20 ms | 0 |
| 100 | 677 | 100,20 | 1.468,91 ms | 0 |
| 250 | 585 | 75,22 | 4.078,05 ms | 208 (35,56%) |

Total: 4.749 chamadas. Na última etapa, as falhas foram de conexão ou timeout, sem respostas HTTP de erro. A rotina encerrou o crescimento após superar 5% de erros ou P95 de dois segundos. Os níveis 500 e 1.000 estavam no roteiro, mas **não foram executados** após a parada e não são apresentados como medições.

O resultado mostra degradação nesse cenário; não separa o gargalo do gerador, da API ou do simulador. Os seis segundos por nível não são um teste prolongado de estabilidade. Não há medição de Render, Vercel, TLS, rede pública, Supabase/PostgreSQL real, RLS, autenticação, e-mails ou navegadores completos. Não se pode converter os números diretamente em capacidade de usuários, quantidade de servidores ou limites do banco de produção.

## Projeção de 50 milhões

Com uma chamada por usuário a cada 30 segundos, 50 milhões de usuários ativos representam aproximadamente 1.666.667 chamadas por segundo. Isso é uma conta de demanda, não uma carga executada. A aba permite ajustar usuários, chamadas por ciclo e intervalo e declara suas unidades e hipóteses.

Comprovar essa escala exige infraestrutura e geradores distribuídos, um ambiente de teste isolado equivalente ao real e autorização de recursos e custos. Este trabalho não contratou infraestrutura nem enviou carga a serviços de produção.

## Repetir localmente

1. Execute `npm.cmd run verificar` para testar e compilar.
2. Execute `npm.cmd run testar:carga` na raiz. A rotina inicia seus próprios processos em loopback e os encerra em `finally`, inclusive em interrupção. Não aceita uma URL externa.
3. O relatório agregado é salvo em `frontend/publico/diagnosticos/carga.json`. Atualizá-lo substitui o último ensaio; publicar o frontend é necessário para atualizar o site.

Limites da rotina: 1.000 clientes programados, até 200 mil chamadas, três minutos, memória livre mínima verificada entre etapas e parada após degradação. O relatório publica somente agregados, ambiente sem identificação da máquina e condições do teste. Não contém credenciais, corpos de resposta ou registros reais.
