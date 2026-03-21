drop policy if exists "members can manage expenses" on public.expenses;
create policy "members can view household expenses" on public.expenses
for select using (public.is_household_member(household_id));

create policy "members can insert own expenses" on public.expenses
for insert with check (
  public.is_household_member(household_id)
  and created_by = auth.uid()
);

create policy "creators can update own expenses" on public.expenses
for update using (created_by = auth.uid())
with check (created_by = auth.uid() and public.is_household_member(household_id));

create policy "creators can delete own expenses" on public.expenses
for delete using (created_by = auth.uid());
