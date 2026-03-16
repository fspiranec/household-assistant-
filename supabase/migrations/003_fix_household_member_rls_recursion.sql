create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
  );
$$;

create or replace function public.is_household_owner(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.role = 'owner'
  );
$$;

drop policy if exists "members can view households" on public.households;
create policy "members can view households" on public.households
for select using (public.is_household_member(id));

drop policy if exists "members can view membership" on public.household_members;
create policy "members can view membership" on public.household_members
for select using (user_id = auth.uid());

drop policy if exists "owners manage members" on public.household_members;
create policy "owners manage members" on public.household_members
for insert with check (public.is_household_owner(household_id));
