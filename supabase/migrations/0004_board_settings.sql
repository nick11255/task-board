-- 0004_board_settings.sql: one settings row per guest (for now, just the board name)
--
-- Same standards as 0001–0003: RLS, user_id defaults to auth.uid() and is
-- never sent by the client, explicit grants (auto-expose is off).
begin;

create table public.board_settings (
  user_id     uuid primary key default auth.uid()
                references auth.users (id) on delete cascade,
  board_name  text not null
                -- 1–60 characters after trimming, and stored already trimmed,
                -- so "a" followed by 1,000 spaces can't sneak past the length check.
                constraint board_settings_name_valid check (
                  board_name = btrim(board_name)
                  and char_length(board_name) between 1 and 60
                ),
  updated_at  timestamptz not null default now()
);

-- Reuses 0001's trigger function (search_path = '').
create trigger board_settings_set_updated_at
  before update on public.board_settings
  for each row execute function public.set_updated_at();

-- Row Level Security + explicit grants
alter table public.board_settings enable row level security;

revoke all on table public.board_settings from anon, authenticated;
-- No DELETE: Clear board leaves the name alone, and deleting the user cascades.
grant select, insert, update on table public.board_settings to authenticated;

create policy "board_settings_select_own"
  on public.board_settings for select to authenticated
  using (user_id = (select auth.uid()));

create policy "board_settings_insert_own"
  on public.board_settings for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "board_settings_update_own"
  on public.board_settings for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

commit;
