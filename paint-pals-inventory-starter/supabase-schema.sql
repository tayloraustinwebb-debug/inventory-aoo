create table if not exists profiles (
  id uuid primary key,
  full_name text,
  role text default 'owner',
  created_at timestamptz default now()
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null,
  created_at timestamptz default now()
);

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'crew',
  created_at timestamptz default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  category text,
  unit text,
  quantity integer not null default 0,
  min_stock integer not null default 0,
  unit_cost numeric(10,2) not null default 0,
  location_type text,
  sublocation text,
  brand text,
  notes text,
  preferred_store text,
  product_url text,
  assigned_to text,
  status text default 'in_stock',
  cheapest_store text,
  cheapest_price numeric(10,2),
  last_price_checked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
