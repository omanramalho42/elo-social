-- Dados DEMONSTRATIVOS (os mesmos 3 do protótipo do Figma). Posições no mapa aproximadas.
insert into public.ongs (nome, bairro, area, descricao, contato, lat, lon, status, verificacao) values
 ('Instituto Maré Viva', 'Praia de Iracema', 'Meio ambiente',      'Educação ambiental e cuidado coletivo com a orla de Fortaleza.',        'Não informado (demonstração)', -3.7227, -38.5106, 'aprovada', 'demonstrativo'),
 ('Rede Aprender',       'Benfica',          'Educação',           'Apoio escolar e incentivo à leitura para crianças e jovens.',            'Não informado (demonstração)', -3.7405, -38.5400, 'aprovada', 'demonstrativo'),
 ('Casa do Cuidado',     'Messejana',        'Assistência social', 'Rede comunitária de acolhimento e orientação a famílias.',               'Não informado (demonstração)', -3.8300, -38.4950, 'aprovada', 'demonstrativo');

insert into public.projetos (ong_id, nome, descricao)
select id, 'Biblioteca aberta', 'Rodas de leitura gratuitas aos sábados.' from public.ongs where nome = 'Rede Aprender';

-- Primeiro ADMIN: crie o usuário em Authentication e rode:
-- insert into public.perfis (user_id, papel, email) values ('<UUID-do-usuario>', 'admin', '<email>');
