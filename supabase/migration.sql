-- ============================================================
-- Categorizador de Fatura — Supabase Migration
-- ============================================================

-- 1. Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Categories
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color_index int not null default 0,
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table public.categories enable row level security;

create policy "Users manage own categories"
  on public.categories for all
  using (auth.uid() = user_id);

-- 3. Auto-categorization rules
create table public.auto_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  keywords text[] not null,
  category text not null,
  created_at timestamptz default now()
);

alter table public.auto_rules enable row level security;

create policy "Users manage own rules"
  on public.auto_rules for all
  using (auth.uid() = user_id);

-- 4. Invoices (each OFX import)
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text,
  total numeric default 0,
  transaction_count int default 0,
  imported_at timestamptz default now()
);

alter table public.invoices enable row level security;

create policy "Users manage own invoices"
  on public.invoices for all
  using (auth.uid() = user_id);

-- 5. Transactions
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  invoice_id uuid references public.invoices on delete cascade,
  fit_id text,
  memo text not null,
  amount numeric not null,
  date text not null,
  category text,
  auto_categorized boolean default false,
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;

create policy "Users manage own transactions"
  on public.transactions for all
  using (auth.uid() = user_id);

-- 6. Purchase item categories (separate from transaction categories)
create table public.purchase_item_categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color_index int not null default 0,
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table public.purchase_item_categories enable row level security;

create policy "Users manage own purchase categories"
  on public.purchase_item_categories for all
  using (auth.uid() = user_id);

-- 7. Purchase items (notes per invoice — do not affect totals)
create table public.purchase_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  invoice_id uuid references public.invoices on delete cascade not null,
  description text not null,
  amount numeric,
  category text,
  created_at timestamptz default now()
);

alter table public.purchase_items enable row level security;

create policy "Users manage own purchase items"
  on public.purchase_items for all
  using (auth.uid() = user_id);

-- 8. Indexes
create index idx_transactions_user on public.transactions (user_id);
create index idx_transactions_invoice on public.transactions (invoice_id);
create index idx_categories_user on public.categories (user_id);
create index idx_invoices_user on public.invoices (user_id);
create index idx_auto_rules_user on public.auto_rules (user_id);
create index idx_purchase_items_invoice on public.purchase_items (invoice_id);
create index idx_purchase_item_categories_user on public.purchase_item_categories (user_id);
