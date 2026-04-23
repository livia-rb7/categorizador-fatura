-- ============================================================
-- Migration: Purchase items (anotações de compras por fatura)
-- Rode este SQL no Supabase SQL Editor
-- ============================================================

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

create index idx_purchase_items_invoice on public.purchase_items (invoice_id);
create index idx_purchase_item_categories_user on public.purchase_item_categories (user_id);
