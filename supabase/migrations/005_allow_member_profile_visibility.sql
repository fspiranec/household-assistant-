drop policy if exists "members can view membership" on public.household_members;
create policy "members can view membership" on public.household_members
for select using (
  user_id = auth.uid()
  or public.is_household_member(household_id)
);

drop policy if exists "users can view own profile" on public.users;
create policy "users can view own profile" on public.users
for select using (
  auth.uid() = id
  or exists (
    select 1
    from public.household_members hm
    where hm.user_id = public.users.id
      and public.is_household_member(hm.household_id)
  )
);
