-- Dados públicos de associações reais de Fortaleza, consultados em 09/11/2026.
-- A publicação não representa parceria nem confirma vínculo institucional.
-- Os marcadores foram obtidos por busca de endereço no OpenStreetMap/Nominatim
-- e podem não corresponder à entrada exata das instituições.

insert into public.ongs
  (nome, cnpj, bairro, area, descricao, endereco, contato, site, lat, lon, status, verificacao)
values
  (
    'Associação Peter Pan', '02943482000149', 'Vila União', 'Saúde',
    'Associação de combate ao câncer infantojuvenil que oferece acolhimento e programas de promoção à saúde para crianças e adolescentes em tratamento e suas famílias.',
    'Rua Alberto Montezuma, 350, Vila União, Fortaleza - CE',
    '(85) 99994-8171', 'https://www.app.org.br/',
    -3.7657177, -38.5330657, 'pendente', 'nao_verificado'
  ),
  (
    'Associação Projeto Frente Beneficente para a Criança',
    '11333200000182', 'Alto da Balança', 'Assistência social',
    'Entidade filantrópica de Fortaleza que atende crianças, adolescentes, jovens e famílias em situação de vulnerabilidade por meio de ações de educação, saúde e promoção social.',
    'Rua Capitão Uruguai, 393, Alto da Balança, Fortaleza - CE',
    'projetofbpc1458@hotmail.com', 'https://www.frentebeneficente.org.br/',
    -3.7665153, -38.5142417, 'pendente', 'nao_verificado'
  )
on conflict (cnpj) do nothing;

insert into public.ongs_privado (ong_id, responsavel, referencias)
select id, 'Equipe EloSocial (levantamento em fontes públicas)',
  'Fontes: https://www.app.org.br/quem-somos/ ; https://www.app.org.br/projetos/ ; https://www.app.org.br/contato-geral/ ; CNPJ e endereço em https://app.org.br/wp-content/uploads/2021/11/Relatorio-de-atividades-2020.pdf . Sem vínculo institucional. Localização aproximada por OpenStreetMap/Nominatim.'
from public.ongs where cnpj = '02943482000149'
on conflict (ong_id) do nothing;

insert into public.ongs_privado (ong_id, responsavel, referencias)
select id, 'Equipe EloSocial (levantamento em fontes públicas)',
  'Fontes: https://www.frentebeneficente.org.br/quem-somos ; https://www.frentebeneficente.org.br/programas-e-projetos ; https://www.frentebeneficente.org.br/contatos . Sem vínculo institucional. Localização aproximada por OpenStreetMap/Nominatim.'
from public.ongs where cnpj = '11333200000182'
on conflict (ong_id) do nothing;

insert into public.projetos (ong_id, nome, descricao)
select o.id, p.nome, p.descricao
from (
  values
    ('02943482000149', 'Aperfeiçoamento de Dados do Registro Hospitalar do Câncer',
      'Projeto para melhorar indicadores e relatórios sobre o tratamento no Centro Pediátrico do Câncer. Fonte: https://www.app.org.br/projetos/'),
    ('02943482000149', 'Revitalização da Recepção do Hospital Peter Pan',
      'Reestruturação da recepção para acolher melhor pacientes e famílias. Fonte: https://www.app.org.br/projetos/'),
    ('11333200000182', 'Programa Crescendo com Você',
      'Apoia crianças de 0 a 5 anos e oferece atividades com familiares e cuidadores. Fonte: https://www.frentebeneficente.org.br/programas-e-projetos'),
    ('11333200000182', 'Programa PACTO',
      'Participação cívica, transformação e oportunidades para jovens de 15 a 24 anos. Fonte: https://www.frentebeneficente.org.br/programas-e-projetos')
) as p(cnpj, nome, descricao)
join public.ongs o on o.cnpj = p.cnpj
where not exists (
  select 1 from public.projetos existente
  where existente.ong_id = o.id and existente.nome = p.nome
);
