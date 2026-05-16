
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- transaction type enum
create type public.transaction_type as enum ('income', 'expense');

-- categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type public.transaction_type not null,
  icon text not null default 'Tag',
  color text not null default '#4f46e5',
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "categories_all_own" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index categories_user_idx on public.categories(user_id);

-- transactions
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type public.transaction_type not null,
  amount numeric(14,2) not null check (amount > 0),
  note text,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "transactions_all_own" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index transactions_user_date_idx on public.transactions(user_id, occurred_on desc);

-- budgets
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  month date not null,
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);
alter table public.budgets enable row level security;
create policy "budgets_all_own" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- handle new user: create profile + seed categories
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.categories (user_id, name, type, icon, color) values
    (new.id, 'Salary', 'income', 'Wallet', '#10b981'),
    (new.id, 'Freelance', 'income', 'Briefcase', '#06b6d4'),
    (new.id, 'Gifts', 'income', 'Gift', '#a78bfa'),
    (new.id, 'Food', 'expense', 'UtensilsCrossed', '#f97316'),
    (new.id, 'Transport', 'expense', 'Car', '#3b82f6'),
    (new.id, 'Housing', 'expense', 'Home', '#8b5cf6'),
    (new.id, 'Shopping', 'expense', 'ShoppingBag', '#ec4899'),
    (new.id, 'Entertainment', 'expense', 'Film', '#f43f5e'),
    (new.id, 'Health', 'expense', 'HeartPulse', '#22c55e'),
    (new.id, 'Bills', 'expense', 'Receipt', '#eab308');

  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
