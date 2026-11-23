# Equipe administrativa

Em `/admin`, o botão **Administradores** lista a equipe e oferece **Novo administrador**. A pessoa cria seu próprio acesso em `/criar-conta`, confirma o e-mail e não cadastra uma ONG nessa conta. Um administrador existente informa seu e-mail e confirma a autorização para conceder o papel administrativo. Contas já vinculadas a ONG são recusadas para manter os acessos separados. Cada administrador pode revisar ONGs e adicionar outros administradores.

`GET` e `POST /api/admin/administradores` exigem administrador no servidor. A escrita do papel usa service_role exclusivamente após essa checagem e a validação estrita de e-mail/confirmar=true. O cadastro público não aceita papel. Permissões existentes do SQL revogam escrita de `perfis` de anon/authenticated; nenhuma política ou migração foi alterada. O RLS continua consultando o papel em `perfis`.

Validação em 23/11/2026: conta temporária no mesmo projeto Supabase, sem e-mail enviado. Confirmados bloqueios 401/403, e-mail não confirmado (422), confirmação ausente/falsa (422), escrita direta de papel pelo usuário recusada no banco, concessão pelo administrador (201), acesso da nova conta à administração e duplicidade (409). Conta e perfil temporários removidos e ausência verificada. Nenhuma conta existente da equipe foi promovida. Mensageria e notificações permanecem fora desta alteração, conforme pedido do usuário.

A barra da lista de ONGs no mapa recebeu trilho transparente, largura reduzida, cantos arredondados e cores nos dois temas, preservando a rolagem.
