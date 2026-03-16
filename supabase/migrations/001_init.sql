create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  first_name text not null,
  last_name text not null,
  email text unique not null,
  created_at timestamptz default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz default now(),
  primary key (household_id, user_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null,
  token text unique not null,
  status text not null default 'pending',
  invited_by uuid not null references public.users(id),
  created_at timestamptz default now(),
  accepted_at timestamptz
);

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  unique (household_id, name)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  created_by uuid references public.users(id),
  unique (household_id, name)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references public.users(id),
  amount numeric(12,2) not null check (amount >= 0),
  date date not null,
  merchant text not null,
  category text not null,
  tags text[] default '{}',
  notes text,
  parsed_payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.expense_items (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  name text not null,
  quantity numeric(10,2),
  unit_price numeric(10,2),
  line_total numeric(10,2)
);

create table public.expense_files (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  path text not null,
  bucket text not null default 'expense-files',
  uploaded_by uuid not null references public.users(id),
  created_at timestamptz default now()
);

create index idx_household_members_user_id on public.household_members(user_id);
create index idx_expenses_household_date on public.expenses(household_id, date desc);
create index idx_expenses_category on public.expenses(household_id, category);
create index idx_expenses_tags on public.expenses using gin(tags);
create index idx_invitations_token on public.invitations(token);

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

insert into public.users (id, username, first_name, last_name, email)
select
  au.id,
  coalesce(au.raw_user_meta_data ->> 'username', split_part(au.email, '@', 1)),
  coalesce(au.raw_user_meta_data ->> 'first_name', ''),
  coalesce(au.raw_user_meta_data ->> 'last_name', ''),
  au.email
from auth.users au
on conflict (id) do nothing;

alter table public.users enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.invitations enable row level security;
alter table public.expense_categories enable row level security;
alter table public.tags enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_items enable row level security;
alter table public.expense_files enable row level security;

create policy "users can view own profile" on public.users for select using (auth.uid() = id);
create policy "users can update own profile" on public.users for update using (auth.uid() = id);
create policy "users can insert own profile" on public.users for insert with check (auth.uid() = id);

create policy "members can view households" on public.households
for select using (exists (select 1 from public.household_members hm where hm.household_id = id and hm.user_id = auth.uid()));
create policy "users can create households" on public.households
for insert with check (created_by = auth.uid());

create policy "members can view membership" on public.household_members
for select using (user_id = auth.uid() or exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));
create policy "owners manage members" on public.household_members
for insert with check (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid() and hm.role = 'owner'));

create policy "creators can add themselves as owner" on public.household_members
for insert with check (
  user_id = auth.uid()
  and role = 'owner'
  and exists (select 1 from public.households h where h.id = household_id and h.created_by = auth.uid())
);

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

create policy "members can view invites" on public.invitations
for select using (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));
create policy "members can create invites" on public.invitations
for insert with check (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));
create policy "invitees can update invites" on public.invitations
for update using (email = auth.jwt()->>'email');

create policy "members can view categories" on public.expense_categories
for select using (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));
create policy "members can manage categories" on public.expense_categories
for all using (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()))
with check (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));

create policy "members can manage tags" on public.tags
for all using (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()))
with check (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));

create policy "members can manage expenses" on public.expenses
for all using (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()))
with check (exists (select 1 from public.household_members hm where hm.household_id = household_id and hm.user_id = auth.uid()));

create policy "members can manage expense items" on public.expense_items
for all using (exists (select 1 from public.expenses e join public.household_members hm on hm.household_id = e.household_id where e.id = expense_id and hm.user_id = auth.uid()))
with check (exists (select 1 from public.expenses e join public.household_members hm on hm.household_id = e.household_id where e.id = expense_id and hm.user_id = auth.uid()));

create policy "members can manage expense files" on public.expense_files
for all using (exists (select 1 from public.expenses e join public.household_members hm on hm.household_id = e.household_id where e.id = expense_id and hm.user_id = auth.uid()))
with check (exists (select 1 from public.expenses e join public.household_members hm on hm.household_id = e.household_id where e.id = expense_id and hm.user_id = auth.uid()));
