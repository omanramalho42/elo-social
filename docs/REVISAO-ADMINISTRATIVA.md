# Localização e aprovação de ONGs

Na administração, a publicação exige latitude e longitude na região de Fortaleza. O backend valida os limites de latitude (-4,1 a -3,6) e longitude (-38,8 a -38,3). A ausência de gestor em um cadastro antigo não impede sua publicação; a verificação de vínculo institucional é independente.

Em 23/11/2026, o fluxo foi tornado explícito: o administrador pode abrir um mapa, ampliar até o endereço e selecionar o ponto da instituição. Os campos continuam editáveis, aceitam ponto ou vírgula decimal e informam o motivo do bloqueio. Não são preenchidos automaticamente com o centro da cidade nem com coordenadas de exemplo. A posição precisa ser conferida antes da aprovação. A seleção no mapa não aprova o cadastro por si só.

Verificação: 27 testes locais, builds dos dois projetos e TypeScript aprovados. No navegador, usando a conta administrativa existente, foram conferidos bloqueio com campos vazios, liberação com coordenadas válidas, bloqueio fora da região e preenchimento por clique no mapa. Nenhum cadastro existente foi aprovado ou rejeitado nesse ensaio. Esse resultado não comprova todos os fluxos da aplicação.

Também corrigido o esvaziamento da lista ao clicar novamente na aba administrativa já selecionada.
