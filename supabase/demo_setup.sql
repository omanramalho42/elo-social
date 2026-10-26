-- PREPARAÇÃO DA DEMONSTRAÇÃO (rode UMA vez, depois de 0001, 0002 e seed.sql)
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

-- Vincula o gestor à ONG "Rede Aprender" (a que tem projeto de exemplo)
update public.ongs
set owner_id = (select id from auth.users where email = 'gestor@demo.org')
where nome = 'Rede Aprender';

-- Conferência: deve mostrar a ONG com o dono preenchido
select id, nome, status, owner_id from public.ongs;
