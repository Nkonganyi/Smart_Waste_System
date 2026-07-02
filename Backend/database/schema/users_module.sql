-- ============================================================================
-- User Management Module - Schema
-- Run this in the Supabase SQL editor (or via `psql`) for a fresh project.
-- Covers: registration, login, email verification, profile management,
-- and admin-controlled suspension.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------
create table if not exists users (
    id            uuid primary key default gen_random_uuid(),
    name          text not null,
    email         text not null unique,
    password_hash text not null,
    role          text not null default 'citizen' check (role in ('citizen', 'collector', 'admin')),
    phone         text,
    address       text,
    is_verified   boolean not null default false,
    is_suspended  boolean not null default false,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create index if not exists idx_users_email on users (email);
create index if not exists idx_users_role on users (role);

-- ----------------------------------------------------------------------------
-- email_verification_tokens
-- One active token per user (re-registering / resending overwrites it).
-- ----------------------------------------------------------------------------
create table if not exists email_verification_tokens (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references users (id) on delete cascade,
    token      text not null unique,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    unique (user_id)
);

create index if not exists idx_evt_token on email_verification_tokens (token);

-- ----------------------------------------------------------------------------
-- password_reset_tokens
-- One active reset token per user.
-- ----------------------------------------------------------------------------
create table if not exists password_reset_tokens (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references users (id) on delete cascade,
    token      text not null unique,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    unique (user_id)
);

create index if not exists idx_prt_token on password_reset_tokens (token);

-- ============================================================================
-- Waste Report Management Module - Schema
-- Covers: report submission, image upload tracking, location/coordinates,
-- duplicate detection (parent_report_id), and full status lifecycle.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- reports
-- parent_report_id = NULL  → primary report
-- parent_report_id = <uuid> → duplicate of that report
-- ----------------------------------------------------------------------------
create table if not exists reports (
    id                    uuid primary key default gen_random_uuid(),
    user_id               uuid not null references users (id) on delete cascade,
    title                 text not null,
    description           text not null,
    location              text not null,                       -- free-text address/landmark
    latitude              double precision,                    -- set by geocoder after submission
    longitude             double precision,
    priority              text not null default 'normal'
                              check (priority in ('low', 'normal', 'medium', 'high')),
    status                text not null default 'pending'
                              check (status in ('pending', 'approved', 'rejected',
                                                'in_progress', 'completed', 'cancelled')),
    image_url             text,                               -- primary evidence photo URL
    image_urls            text[],                             -- additional photos (up to 3 total)
    completion_image_url  text,                               -- optional proof-of-completion photo
    parent_report_id      uuid references reports (id) on delete set null,
    completed_at          timestamptz,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now()
);

create index if not exists idx_reports_user_id        on reports (user_id);
create index if not exists idx_reports_status         on reports (status);
create index if not exists idx_reports_parent         on reports (parent_report_id);
create index if not exists idx_reports_coords         on reports (latitude, longitude)
    where latitude is not null and longitude is not null;

-- ----------------------------------------------------------------------------
-- assignments
-- Maps a collector to a report (and, by cascade, to its duplicates).
-- ----------------------------------------------------------------------------
create table if not exists assignments (
    id           uuid primary key default gen_random_uuid(),
    report_id    uuid not null references reports (id) on delete cascade,
    collector_id uuid not null references users (id) on delete cascade,
    created_at   timestamptz not null default now(),
    unique (report_id, collector_id)
);

create index if not exists idx_assignments_collector on assignments (collector_id);
create index if not exists idx_assignments_report    on assignments (report_id);

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
create table if not exists notifications (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references users (id) on delete cascade,
    message    text not null,
    is_read    boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications (user_id);

-- ----------------------------------------------------------------------------
-- Housekeeping: expired tokens don't need to live forever. Safe to run
-- periodically (e.g. via a Supabase scheduled function) — not required for
-- correctness since expiry is also checked at verification time.
-- ----------------------------------------------------------------------------
-- delete from email_verification_tokens where expires_at < now();
-- delete from password_reset_tokens where expires_at < now();
