-- EloSocial - esquema do banco (PostgreSQL / Supabase)
-- Segurança: RLS ligado em TODAS as tabelas.

create type area_atuacao as enum ('Educação', 'Assistência social', 'Meio ambiente', 'Saúde', 'Cultura');
create type status_ong   as enum ('pendente', 'aprovada', 'rejeitada');
create type verificacao_dados as enum ('demonstrativo', 'nao_verificado', 'verificado');

-- Conta de quem gerencia (criada em "Área da ONG > Cadastre-se"). Só o servidor escreve aqui.
create table public.perfis (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  papel    text not null default 'ong' check (papel in ('ong', 'admin')),
  nome     text,
  email    text unique,
  telefone text
);

create table public.ongs (
  id               bigint generated always as identity primary key,
  owner_id         uuid unique references auth.users (id) on delete set null,   -- gestor vinculado (pela equipe)
  nome             text not null check (char_length(nome) between 3 and 120),
  bairro           text not null check (char_length(bairro) between 2 and 80),
  area             area_atuacao not null,
  descricao        text not null check (char_length(descricao) between 20 and 1000),
  endereco         text check (char_length(endereco) <= 200),
  contato          text not null check (char_length(contato) between 5 and 120),
  site             text check (char_length(site) <= 200),
  cnpj             text unique check (cnpj ~ '^[0-9]{14}$'),
  lat              double precision check (lat between -4.1 and -3.6),
  lon              double precision check (lon between -38.8 and -38.3),
  status           status_ong not null default 'pendente',
  verificacao      verificacao_dados not null default 'nao_verificado',
  motivo_rejeicao  text check (char_length(motivo_rejeicao) <= 500),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint aprovada_precisa_de_posicao check (status <> 'aprovada' or (lat is not null and lon is not null))
);
create index ongs_status_idx on public.ongs (status);
create index ongs_area_idx   on public.ongs (area);

-- Dados do pedido que NÃO são públicos (responsável e fontes de conferência).
create table public.ongs_privado (
  ong_id      bigint primary key references public.ongs (id) on delete cascade,
  responsavel text not null check (char_length(responsavel) between 3 and 120),
  referencias text not null check (char_length(referencias) between 10 and 1000)
);

create table public.projetos (
  id         bigint generated always as identity primary key,
  ong_id     bigint not null references public.ongs (id) on delete cascade,
  nome       text not null check (char_length(nome) between 2 and 100),
  descricao  text check (char_length(descricao) <= 500),
  created_at timestamptz not null default now()
);
create index projetos_ong_idx on public.projetos (ong_id);

-- ---------- Funções e gatilhos ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where user_id = auth.uid() and papel = 'admin');
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger ongs_touch before update on public.ongs
  for each row execute function public.touch_updated_at();

-- O gestor NÃO pode mudar status, verificação, CNPJ, dono nem posição, mesmo tentando pela API.
create or replace function public.proteger_campos_ong() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.id := old.id;
    new.owner_id := old.owner_id;
    new.status := old.status;
    new.verificacao := old.verificacao;
    new.cnpj := old.cnpj;
    new.motivo_rejeicao := old.motivo_rejeicao;
    new.lat := old.lat;
    new.lon := old.lon;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;
create trigger ongs_proteger before update on public.ongs
  for each row execute function public.proteger_campos_ong();

create or replace function public.limitar_projetos() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.projetos where ong_id = new.ong_id) >= 30 then
    raise exception 'Limite de 30 projetos por ONG atingido.';
  end if;
  return new;
end $$;
create trigger projetos_limite before insert on public.projetos
  for each row execute function public.limitar_projetos();

-- ---------- Row Level Security ----------
alter table public.perfis        enable row level security;
alter table public.ongs          enable row level security;
alter table public.ongs_privado  enable row level security;
alter table public.projetos      enable row level security;

revoke all on public.perfis, public.ongs_privado from anon;
revoke insert, delete on public.ongs from anon, authenticated;
revoke insert, update, delete on public.perfis from anon, authenticated;
revoke insert, update, delete on public.ongs_privado from anon, authenticated;
revoke all on public.ongs, public.projetos from anon;
grant select on public.ongs, public.projetos to anon;

create policy perfis_ler_proprio on public.perfis for select to authenticated
  using (user_id = auth.uid());
create policy perfis_admin_le on public.perfis for select to authenticated
  using (public.is_admin());

create policy ongs_publico on public.ongs for select to anon, authenticated
  using (status = 'aprovada');
create policy ongs_dono_le on public.ongs for select to authenticated
  using (owner_id = auth.uid());
create policy ongs_admin_le on public.ongs for select to authenticated
  using (public.is_admin());
create policy ongs_dono_edita on public.ongs for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy ongs_admin_edita on public.ongs for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy privado_dono_le on public.ongs_privado for select to authenticated
  using (exists (select 1 from public.ongs o where o.id = ong_id and o.owner_id = auth.uid()));
create policy privado_admin_le on public.ongs_privado for select to authenticated
  using (public.is_admin());

create policy projetos_publico on public.projetos for select to anon, authenticated
  using (exists (select 1 from public.ongs o where o.id = ong_id and o.status = 'aprovada'));
create policy projetos_dono_le on public.projetos for select to authenticated
  using (exists (select 1 from public.ongs o where o.id = ong_id and o.owner_id = auth.uid()));
create policy projetos_dono_insere on public.projetos for insert to authenticated
  with check (exists (select 1 from public.ongs o where o.id = ong_id and o.owner_id = auth.uid()));
create policy projetos_dono_apaga on public.projetos for delete to authenticated
  using (exists (select 1 from public.ongs o where o.id = ong_id and o.owner_id = auth.uid()));
create policy projetos_admin_tudo on public.projetos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
