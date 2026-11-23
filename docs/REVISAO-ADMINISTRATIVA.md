# Localização e aprovação de ONGs

Na administração, a publicação exige latitude e longitude na região de Fortaleza. O backend valida os limites de latitude (-4,1 a -3,6) e longitude (-38,8 a -38,3). A ausência de gestor em um cadastro antigo não impede sua publicação; a verificação de vínculo institucional é independente.

Em 23/11/2026, o fluxo foi tornado explícito: o administrador pode abrir um mapa, ampliar até o endereço e selecionar o ponto da instituição. Os campos continuam editáveis, aceitam ponto ou vírgula decimal e informam o motivo do bloqueio. Não são preenchidos automaticamente com o centro da cidade nem com coordenadas de exemplo. A posição precisa ser conferida antes da aprovação. A seleção no mapa não aprova o cadastro por si só.

Verificação: 27 testes locais, builds dos dois projetos e TypeScript aprovados. No navegador, usando a conta administrativa existente, foram conferidos bloqueio com campos vazios, liberação com coordenadas válidas, bloqueio fora da região e preenchimento por clique no mapa. Nenhum cadastro existente foi aprovado ou rejeitado nesse ensaio. Esse resultado não comprova todos os fluxos da aplicação.

Também corrigido o esvaziamento da lista ao clicar novamente na aba administrativa já selecionada.

## Preenchimento automático e situação pública

Após esclarecimento do usuário, a revisão passou a consultar automaticamente `GET /api/admin/ongs/{id}/localizacao` quando os dois campos de coordenadas estão vazios. A rota exige administrador e consulta somente o endereço institucional já cadastrado. Não aceita uma URL ou endereço arbitrário na requisição e não altera registros. A busca usa [Photon](https://github.com/komoot/photon) sobre dados OpenStreetMap, com fila, deduplicação e cache em memória de até 250 consultas por 24 horas. O servidor público do Photon admite uso moderado e não garante disponibilidade; para maior volume, configure outra instância compatível em `GEOCODIFICACAO_URL`.

O resultado deve corresponder à via informada, à cidade de Fortaleza e aos limites de coordenadas aceitos pela aplicação. Resultados genéricos da cidade, de outra via ou fora da região são recusados. A precisão distingue via e número; encontrar a rua não comprova a posição do imóvel. A tela preenche os campos e abre o mapa, permite correção e não sobrescreve alterações manuais feitas enquanto aguarda. Falhas ou endereços não encontrados mantêm o ajuste no mapa disponível. A aprovação continua sendo uma ação explícita do administrador.

O texto público “Verificação pendente” foi trocado por “Vínculo institucional não confirmado”. A situação de publicação (`status`) e a confirmação do vínculo (`verificacao`) são atributos diferentes; nenhum status de cadastro foi modificado por essa mudança de texto.

Ensaio de leitura com a ONG existente de ID 41: a API encontrou Rua Entrada da Lua, Pici, Fortaleza; o componente preencheu latitude e longitude e informou precisão de via, sem comprovação do número 170. A ONG não foi alterada nesse teste. Não foi feita aprovação automática ou migração de banco.
