-- 0001_core_schema.sql — tasks table, constraints, RLS
--
-- This project has "Automatically expose new tables" turned OFF, so new
-- tables get no default grants. Every migration grants exactly what the
-- app needs: here, `authenticated` (which includes anonymous guest users)
-- gets CRUD on tasks, and `anon` (no session) gets nothing.
begin;

create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  title       text not null
                constraint tasks_title_not_blank check (char_length(btrim(title)) > 0)
                constraint tasks_title_length    check (char_length(title) <= 200),
  description text
                constraint tasks_description_length check (char_length(description) <= 5000),
  status      text not null default 'todo'
                constraint tasks_status_valid check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority    text not null default 'normal'
                constraint tasks_priority_valid check (priority in ('low', 'normal', 'high')),
  due_date    date,
  position    double precision not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column public.tasks.position is
  'Fractional sort key within a status column; client inserts midpoint of neighbors.';

-- Board query: WHERE user_id = ? ORDER BY status, position
create index tasks_user_status_position_idx
  on public.tasks (user_id, status, position);

-- Keep updated_at honest regardless of what the client sends
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.tasks enable row level security;

-- Least privilege: signed-out (anon role) requests get nothing at all.
-- Anonymous *users* sign in and run as the `authenticated` role.
revoke all on table public.tasks from anon;
grant select, insert, update, delete on table public.tasks to authenticated;

create policy "tasks_select_own"
  on public.tasks for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "tasks_insert_own"
  on public.tasks for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "tasks_update_own"
  on public.tasks for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "tasks_delete_own"
  on public.tasks for delete
  to authenticated
  using (user_id = (select auth.uid()));

commit;
