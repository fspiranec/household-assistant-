drop policy if exists "members can view households" on public.households;

create policy "members can view households" on public.households
for select using (
  created_by = auth.uid()
  or public.is_household_member(id)
);
