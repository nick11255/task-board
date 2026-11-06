-- 0002_task_activity.sql: activity log written by a Postgres trigger
--
-- Clients can only READ their own history. Rows are written exclusively
-- by a SECURITY DEFINER trigger on public.tasks, so history can't be
-- forged, edited or deleted from the browser. Auto-expose is off, so
-- grants are explicit.
begin;

create table public.task_activity (
  id          bigint generated always as identity primary key,
  task_id     uuid not null references public.tasks (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null
                constraint task_activity_kind_valid check (kind in (
                  'created', 'status_changed', 'title_changed',
                  'description_changed', 'priority_changed', 'due_date_changed'
                )),
  from_value  jsonb,   -- previous value (null for 'created' and description edits)
  to_value    jsonb,   -- new value
  created_at  timestamptz not null default now()
);

-- Timeline query: WHERE task_id = ? ORDER BY created_at DESC
create index task_activity_task_created_idx
  on public.task_activity (task_id, created_at desc);

-- One row per meaningful change. Position-only updates (drag reorders,
-- renumbering) log nothing.
create or replace function public.log_task_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity (task_id, user_id, kind, to_value)
    values (new.id, new.user_id, 'created', to_jsonb(new.status));
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.task_activity (task_id, user_id, kind, from_value, to_value)
    values (new.id, new.user_id, 'status_changed', to_jsonb(old.status), to_jsonb(new.status));
  end if;

  if new.title is distinct from old.title then
    insert into public.task_activity (task_id, user_id, kind, from_value, to_value)
    values (new.id, new.user_id, 'title_changed', to_jsonb(old.title), to_jsonb(new.title));
  end if;

  -- Descriptions can be 5,000 chars: record that it changed, not both copies.
  if new.description is distinct from old.description then
    insert into public.task_activity (task_id, user_id, kind)
    values (new.id, new.user_id, 'description_changed');
  end if;

  if new.priority is distinct from old.priority then
    insert into public.task_activity (task_id, user_id, kind, from_value, to_value)
    values (new.id, new.user_id, 'priority_changed', to_jsonb(old.priority), to_jsonb(new.priority));
  end if;

  if new.due_date is distinct from old.due_date then
    insert into public.task_activity (task_id, user_id, kind, from_value, to_value)
    values (new.id, new.user_id, 'due_date_changed', to_jsonb(old.due_date), to_jsonb(new.due_date));
  end if;

  return new;
end;
$$;

-- Fires only as a trigger; nobody calls it directly.
revoke all on function public.log_task_activity() from public, anon, authenticated;

create trigger tasks_log_activity
  after insert or update on public.tasks
  for each row execute function public.log_task_activity();

-- Row Level Security: read-only for the owner
alter table public.task_activity enable row level security;

revoke all on table public.task_activity from anon, authenticated;
grant select on table public.task_activity to authenticated;

create policy "task_activity_select_own"
  on public.task_activity for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Backfill: give existing tasks a "created" entry at their real creation time.
insert into public.task_activity (task_id, user_id, kind, to_value, created_at)
select id, user_id, 'created', to_jsonb(status), created_at
from public.tasks;

commit;
