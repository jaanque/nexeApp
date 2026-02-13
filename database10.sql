create table if not exists daily_claims (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  claimed_at timestamp with time zone default now() not null
);

-- Policy to allow users to insert their own claims (controlled by app logic or RLS)
alter table daily_claims enable row level security;
create policy "Users can insert their own claims" on daily_claims for insert with check (auth.uid() = user_id);
create policy "Users can view their own claims" on daily_claims for select using (auth.uid() = user_id);

-- Add index on user_id and claimed_at for performance
create index if not exists daily_claims_user_id_claimed_at_idx on daily_claims (user_id, claimed_at);
