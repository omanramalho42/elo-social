-- PREPARAÇÃO DAS CONTAS DE TESTE (rode UMA vez depois das migrações)
--
-- Antes, no painel do Supabase: Authentication > Users > Add user > Create new user.
-- Marque "Auto Confirm User". Crie dois usuários:
--   1) gestor@demo.org  (senha: Demo12345)
--   2) admin@demo.org   (senha: Demo12345)
-- Troque abaixo pelos e-mails que você criou.

insert into public.perfis (user_id, papel, nome, email, telefone)
select id, 'ong', 'Gestor Demonstração', email, '85999990000' from auth.users where email = 'gestor@demo.org';

insert into public.perfis (user_id, papel, nome, email)
select id, 'admin', 'Equipe EloSocial', email from auth.users where email = 'admin@demo.org';

-- A conta de gestor de teste fica sem vínculo permanente. O ensaio integrado
-- cria uma ONG temporária, testa o vínculo e remove os registros ao terminar.
-- Nunca vincule uma conta de demonstração a uma associação real sem autorização.
select id, nome, status, owner_id from public.ongs;
