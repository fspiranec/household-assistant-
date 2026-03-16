-- Safe re-run script for projects where base tables already exist.
-- Run this in Supabase SQL Editor when 001_init.sql fails with "relation already exists".

create extension if not exists "pgcrypto";

-- Ensure app roles can access tables (RLS still applies).
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;

-- Keep public.users synced from auth.users.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, username, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email
  )
  on conflict (id) do update
  set
    username = excluded.username,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- Backfill existing auth users into public.users.
insert into public.users (id, username, first_name, last_name, email)
select
  au.id,
  coalesce(au.raw_user_meta_data ->> 'username', split_part(au.email, '@', 1)),
  coalesce(au.raw_user_meta_data ->> 'first_name', ''),
  coalesce(au.raw_user_meta_data ->> 'last_name', ''),
  au.email
from auth.users au
on conflict (id) do update
set
  username = excluded.username,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email;

-- Ensure RLS is enabled.
alter table public.users enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.invitations enable row level security;
alter table public.expense_categories enable row level security;
alter table public.tags enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_items enable row level security;
alter table public.expense_files enable row level security;

-- Recreate policies idempotently.
drop policy if exists "users can view own profile" on public.users;
create policy "users can view own profile" on public.users for select using (auth.uid() = id);
drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile" on public.users for update using (auth.uid() = id);
drop policy if exists "users can insert own profile" on public.users;
create policy "users can insert own profile" on public.users for insert with check (auth.uid() = id);

drop policy if exists "members can view households" on public.households;
create policy "members can view households" on public.households
for select using (exists (select 1 from public.household_members hm where hm.household_id = id and hm.user_id = auth.uid()));
drop policy if exists "users can create households" on public.households;
create policy "users can create households" on public.households
for insert with check (created_by = auth.uid());

drop policy if exists "members can view membership" on public.household_members;
create policy "members can view membership" on public.household_members
for select using (user_id = auth.uid() or exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));
drop policy if exists "owners manage members" on public.household_members;
create policy "owners manage members" on public.household_members
for insert with check (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid() and hm.role = 'owner'));
drop policy if exists "creators can add themselves as owner" on public.household_members;
create policy "creators can add themselves as owner" on public.household_members
for insert with check (
  user_id = auth.uid()
  and role = 'owner'
  and exists (select 1 from public.households h where h.id = household_id and h.created_by = auth.uid())
);
drop policy if exists "invitees can join household" on public.household_members;
create policy "invitees can join household" on public.household_members
for insert with check (
  user_id = auth.uid()
  and role = 'member'
  and exists (
    select 1
    from public.invitations i
    where i.household_id = household_id
      and i.email = auth.jwt()->>'email'
      and i.status = 'pending'
  )
);

drop policy if exists "members can view invites" on public.invitations;
create policy "members can view invites" on public.invitations
for select using (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));
drop policy if exists "members can create invites" on public.invitations;
create policy "members can create invites" on public.invitations
for insert with check (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));
drop policy if exists "invitees can update invites" on public.invitations;
create policy "invitees can update invites" on public.invitations
for update using (email = auth.jwt()->>'email');

drop policy if exists "members can view categories" on public.expense_categories;
create policy "members can view categories" on public.expense_categories
for select using (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));
drop policy if exists "members can manage categories" on public.expense_categories;
create policy "members can manage categories" on public.expense_categories
for all using (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()))
with check (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));

drop policy if exists "members can manage tags" on public.tags;
create policy "members can manage tags" on public.tags
for all using (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()))
with check (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));

drop policy if exists "members can manage expenses" on public.expenses;
create policy "members can manage expenses" on public.expenses
for all using (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()))
with check (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));

drop policy if exists "members can manage expense items" on public.expense_items;
create policy "members can manage expense items" on public.expense_items
for all using (exists (select 1 from public.expenses e join public.household_members hm on hm.household_id = e.household_id where e.id = expense_id and hm.user_id = auth.uid()))
with check (exists (select 1 from public.expenses e join public.household_members hm on hm.household_id = e.household_id where e.id = expense_id and hm.user_id = auth.uid()));

drop policy if exists "members can manage expense files" on public.expense_files;
create policy "members can manage expense files" on public.expense_files
for all using (exists (select 1 from public.expenses e join public.household_members hm on hm.household_id = e.household_id where e.id = expense_id and hm.user_id = auth.uid()))
with check (exists (select 1 from public.expenses e join public.household_members hm on hm.household_id = e.household_id where e.id = expense_id and hm.user_id = auth.uid()));
