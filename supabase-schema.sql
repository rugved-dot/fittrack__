-- Run this in your Supabase SQL editor

create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  weight_kg numeric(5,2) not null,
  created_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  template_name text not null,
  exercises jsonb not null default '[]',
  created_at timestamptz default now(),
  unique(user_id, date, template_name)
);

create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  name text not null,
  calories numeric(7,2) not null,
  protein_g numeric(6,2) not null default 0,
  carbs_g numeric(6,2) not null default 0,
  fat_g numeric(6,2) not null default 0,
  created_at timestamptz default now()
);

create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  duration_h numeric(4,2) not null,
  deep_h numeric(4,2),
  rem_h numeric(4,2),
  score integer,
  created_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists heart_rate_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  avg integer not null,
  min integer,
  max integer,
  resting integer,
  created_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists step_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  steps integer not null,
  distance_km numeric(6,2),
  calories integer,
  created_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists stress_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  avg integer not null,
  max integer,
  created_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists spo2_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  avg numeric(4,1) not null,
  min numeric(4,1),
  created_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists body_fat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  body_fat_pct numeric(4,1) not null,
  muscle_mass_kg numeric(5,2),
  bmi numeric(4,1),
  created_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'User',
  weight_kg numeric(5,2) default 74,
  target_weight_kg numeric(5,2) default 70,
  height_cm integer default 175,
  age integer default 25,
  calories_goal integer default 1900,
  protein_goal_g integer default 150,
  carbs_goal_g integer default 180,
  fat_goal_g integer default 60,
  updated_at timestamptz default now()
);

-- RLS policies
alter table weight_logs enable row level security;
alter table workout_logs enable row level security;
alter table food_logs enable row level security;
alter table sleep_logs enable row level security;
alter table heart_rate_logs enable row level security;
alter table step_logs enable row level security;
alter table stress_logs enable row level security;
alter table spo2_logs enable row level security;
alter table body_fat_logs enable row level security;
alter table profiles enable row level security;

-- Each user can only see/edit their own data
do $$
declare
  tbl text;
begin
  foreach tbl in array array['weight_logs','workout_logs','food_logs','sleep_logs','heart_rate_logs','step_logs','stress_logs','spo2_logs','body_fat_logs']
  loop
    execute format('create policy "own_data" on %I for all using (auth.uid() = user_id)', tbl);
  end loop;
end $$;

create policy "own_profile" on profiles for all using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
