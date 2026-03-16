alter table public.expenses
add column if not exists is_private boolean not null default false;

create index if not exists idx_expenses_private on public.expenses(household_id, is_private);
