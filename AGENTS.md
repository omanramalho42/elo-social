# Continuidade do EloSocial

Leia `README.md` e `docs/RETOMADA.md` antes de alterar funcionalidades. O registro de retomada separa fatos verificados de etapas ainda não testadas.

- Interface React/Vite em `frontend`; API Next.js em `backend`; banco e autenticação Supabase.
- Preserve o português da interface e as regras de cadastro existentes.
- Use os arquivos de lock com `npm ci` em cada diretório.
- Execute `npm run verificar` na raiz para testar e compilar os dois projetos. `npm run diagnostico` verifica os pré-requisitos locais sem mostrar segredos.
- Não registre chaves, senhas, tokens ou conteúdo de `.env.local` em documentação, logs ou commits.
- Alterações de autorização precisam considerar API e RLS/gatilhos SQL. Não valide permissões apenas pela interface.
- As rotinas de integração, importação e apresentação escrevem no Supabase; confira o destino e o efeito antes de executar. Não execute migrações de criação sobre o banco existente como etapa de instalação.
- Não execute `npm audit fix --force` como correção automática. Atualizações de versão principal exigem análise de compatibilidade e validação dos fluxos.
- Ao concluir correções, atualize o registro de retomada com o que mudou, verificações feitas e limitações restantes. Não declare um fluxo aprovado sem executá-lo.
