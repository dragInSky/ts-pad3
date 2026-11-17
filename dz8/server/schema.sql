create table users (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null unique,
    phone text not null unique,
    password_hash text not null,
    email_verified boolean not null default false,
    phone_verified boolean not null default false,
    version integer not null default 0
);

create table sessions (
    token text primary key,
    user_id uuid not null references users(id) on delete cascade,
    version integer not null,
    expires_at timestamptz not null default now() + interval '7 days'
);
