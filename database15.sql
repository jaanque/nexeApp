-- Clean up previous daily claims attempt
drop table if exists daily_claims;

-- Ensure welcome_gift_claims exists (for one-time reward)
create table if not exists welcome_gift_claims (
  user_id uuid references auth.users not null primary key,
  claimed_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table welcome_gift_claims enable row level security;

-- Policies (using IF NOT EXISTS logic via DO block or just recreating if clean,
-- but simpler to just try creating policies and ignore if exist or drop first)
drop policy if exists "Users can insert their own welcome claim" on welcome_gift_claims;
drop policy if exists "Users can view their own welcome claim" on welcome_gift_claims;

create policy "Users can insert their own welcome claim"
  on welcome_gift_claims for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own welcome claim"
  on welcome_gift_claims for select
  using (auth.uid() = user_id);
