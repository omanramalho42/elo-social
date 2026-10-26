-- Completa o CRUD: editar projeto e excluir ONG (sempre protegidos por RLS).

grant update on public.projetos to authenticated;
create policy projetos_dono_edita on public.projetos for update to authenticated
  using (exists (select 1 from public.ongs o where o.id = ong_id and o.owner_id = auth.uid()))
  with check (exists (select 1 from public.ongs o where o.id = ong_id and o.owner_id = auth.uid()));

-- Impede mover um projeto para outra ONG ao editar.
create or replace function public.proteger_projeto() returns trigger
language plpgsql as $$
begin new.ong_id := old.ong_id; new.id := old.id; new.created_at := old.created_at; return new; end $$;
create trigger projetos_proteger before update on public.projetos
  for each row execute function public.proteger_projeto();

grant delete on public.ongs to authenticated;
create policy ongs_dono_apaga on public.ongs for delete to authenticated
  using (owner_id = auth.uid());
create policy ongs_admin_apaga on public.ongs for delete to authenticated
  using (public.is_admin());
