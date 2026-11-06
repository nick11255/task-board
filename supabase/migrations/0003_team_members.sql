-- 0003_team_members.sql: team members, multi-assignee tasks, assignment history
--
-- Same standards as 0001/0002: RLS on every table, user_id defaults to
-- auth.uid() and is never sent by the client, explicit grants (auto-expose
-- is off), and history is written only by a SECURITY DEFINER trigger.
begin;

-- 1. Team members: each guest has their own roster ----------------------------

create table public.team_members (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  name        text not null
                constraint team_members_name_not_blank check (char_length(btrim(name)) > 0)
                constraint team_members_name_length    check (char_length(name) <= 60),
  color       text not null default 'indigo'
                constraint team_members_color_valid check (color in (
                  'indigo', 'teal', 'amber', 'rose', 'sky', 'violet', 'emerald', 'orange'
                )),
  created_at  timestamptz not null default now(),
  -- Target for the same-owner foreign key on task_assignees below.
  constraint team_members_id_user_id_key unique (id, user_id)
);

-- No two members with the same name (ignoring case and outer spaces) per guest.
create unique index team_members_user_name_key
  on public.team_members (user_id, lower(btrim(name)));

-- 2. Assignments: many members per task, many tasks per member -----------------

-- id is already the primary key; this pair constraint exists only so the
-- composite foreign key below has something to reference.
alter table public.tasks
  add constraint tasks_id_user_id_key unique (id, user_id);

create table public.task_assignees (
  task_id     uuid not null,
  member_id   uuid not null,
  user_id     uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (task_id, member_id),
  -- Composite keys make cross-user links impossible at the schema level: the
  -- task AND the member must both belong to this row's user_id.
  constraint task_assignees_task_fk
    foreign key (task_id, user_id) references public.tasks (id, user_id) on delete cascade,
  constraint task_assignees_member_fk
    foreign key (member_id, user_id) references public.team_members (id, user_id) on delete cascade
);

-- "Which tasks is this member on?" and member-delete cascades.
create index task_assignees_member_idx on public.task_assignees (member_id);

-- 3. History for assignments ----------------------------------------------------

alter table public.task_activity drop constraint task_activity_kind_valid;
alter table public.task_activity add constraint task_activity_kind_valid check (kind in (
  'created', 'status_changed', 'title_changed', 'description_changed',
  'priority_changed', 'due_date_changed', 'assignee_added', 'assignee_removed'
));

create or replace function public.log_assignment_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_name text;
begin
  if tg_op = 'INSERT' then
    select m.name into member_name from public.team_members m where m.id = new.member_id;
    insert into public.task_activity (task_id, user_id, kind, to_value)
    values (new.task_id, new.user_id, 'assignee_added', to_jsonb(member_name));
    return new;
  end if;

  -- DELETE. When the task or member itself is being deleted (cascade), skip:
  -- the task's history is going away too, or there's no name left to show.
  select m.name into member_name from public.team_members m where m.id = old.member_id;
  if member_name is not null and exists (select 1 from public.tasks t where t.id = old.task_id) then
    insert into public.task_activity (task_id, user_id, kind, to_value)
    values (old.task_id, old.user_id, 'assignee_removed', to_jsonb(member_name));
  end if;
  return old;
end;
$$;

revoke all on function public.log_assignment_activity() from public, anon, authenticated;

create trigger task_assignees_log_activity
  after insert or delete on public.task_assignees
  for each row execute function public.log_assignment_activity();

-- 4. Row Level Security + explicit grants --------------------------------------

alter table public.team_members   enable row level security;
alter table public.task_assignees enable row level security;

revoke all on table public.team_members   from anon, authenticated;
revoke all on table public.task_assignees from anon, authenticated;
grant select, insert, update, delete on table public.team_members   to authenticated;
grant select, insert, delete         on table public.task_assignees to authenticated;

create policy "team_members_select_own"
  on public.team_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy "team_members_insert_own"
  on public.team_members for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "team_members_update_own"
  on public.team_members for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "team_members_delete_own"
  on public.team_members for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "task_assignees_select_own"
  on public.task_assignees for select to authenticated
  using (user_id = (select auth.uid()));

create policy "task_assignees_insert_own"
  on public.task_assignees for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "task_assignees_delete_own"
  on public.task_assignees for delete to authenticated
  using (user_id = (select auth.uid()));

commit;
