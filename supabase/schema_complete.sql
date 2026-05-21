-- ============================================================
-- APEX INTELLIGENT AI — COMPLETE SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Includes: tables, RLS policies, grants, functions, triggers
-- May 2026 — Full build
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── 1. PROFILES (synced from auth.users) ──────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  username     text unique,
  full_name    text,
  role         text default 'viewer',
  avatar_url   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table profiles enable row level security;
create policy if not exists "profiles_self" on profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy if not exists "profiles_admin_all" on profiles for all to authenticated using ((select role from profiles where id = auth.uid()) in ('super_admin','fleet_admin'));
grant all on profiles to authenticated;
grant all on profiles to service_role;

-- Auto-sync auth users into profiles
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  )
  on conflict (id) do update set
    email     = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    role      = coalesce(excluded.role, profiles.role),
    updated_at = now();
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. VEHICLES ───────────────────────────────────────────────
create table if not exists vehicles (
  id                     uuid primary key default uuid_generate_v4(),
  -- Identity
  reg_number             text not null,
  fleet_number           text,
  make                   text,
  model                  text,
  variant                text,
  year                   int,
  first_reg_date         date,
  vin                    text,
  type                   text default 'van',
  status                 text default 'idle',
  colour                 text,
  body_type              text,
  vehicle_category       text,
  country_of_reg         text default 'GB',
  -- Engine & Fuel
  engine_make            text,
  engine_model           text,
  engine_cc              numeric,
  engine_power_kw        numeric,
  engine_torque_nm       numeric,
  fuel_type              text default 'diesel',
  fuel_level             numeric default 100,
  fuel_tank_litres       numeric,
  adblue_tank_litres     numeric,
  adblue_level           numeric,
  euro_standard          text,
  dpf_fitted             boolean default false,
  scr_fitted             boolean default false,
  transmission           text,
  gears                  int,
  co2_gkm                numeric,
  noise_db               numeric,
  odometer_km            numeric default 0,
  fuel_card_provider     text,
  fuel_card_number       text,
  -- Dimensions
  height_m               numeric,
  width_m                numeric,
  length_m               numeric,
  wheelbase_m            numeric,
  front_overhang_m       numeric,
  rear_overhang_m        numeric,
  turning_radius_m       numeric,
  -- Weight & Plating
  gross_weight_t         numeric,
  plated_weight_t        numeric,
  plate_date             date,
  unladen_weight_t       numeric,
  payload_kg             numeric,
  train_weight_t         numeric,
  front_axle_weight_t    numeric,
  rear_axle_weight_t     numeric,
  axle_weight_t          numeric,
  -- Axles & Tyres
  num_axles              int,
  drive_axles            int,
  steer_axles            int,
  lift_axle              boolean default false,
  tyre_size_front        text,
  tyre_size_rear         text,
  spare_tyre             boolean default false,
  -- Route Restrictions
  hazmat                 boolean default false,
  hazmat_class           text,
  hazmat_un_number       text,
  tunnel_category        text,
  low_bridge_route       boolean default false,
  max_bridge_weight_t    numeric,
  low_emission_zone      text,
  ulez_compliant         boolean,
  caz_compliant          boolean,
  hgv_restriction_24h    boolean default false,
  max_speed_kmh          numeric,
  speed_limiter          boolean default false,
  -- Cargo & Equipment
  cargo_type             text,
  temperature_controlled boolean default false,
  temp_min_c             numeric,
  temp_max_c             numeric,
  tail_lift              boolean default false,
  tail_lift_kg           numeric,
  crane_fitted           boolean default false,
  crane_reach_m          numeric,
  curtainsider           boolean default false,
  double_deck            boolean default false,
  lashing_points         int,
  lashing_capacity_kg    numeric,
  load_restraint_equipment text,
  trailer_capable        boolean default false,
  trailer_reg            text,
  trailer_length_m       numeric,
  trailer_weight_t       numeric,
  trailer_annual_test    date,
  trailer_plate_weight_t numeric,
  trailer_brake_type     text,
  -- Driver & Tachograph
  assigned_driver        text,
  driver_name            text,
  assigned_driver_licence text,
  driver_cpc_number      text,
  driver_cpc_expiry      date,
  driver_tacho_card      text,
  driver_tacho_expiry    date,
  tacho_fitted           boolean default false,
  tacho_serial           text,
  tacho_type             text,
  tacho_last_calibration date,
  tacho_next_calibration date,
  tacho_calibration_cert text,
  tacho_seal_number      text,
  tacho_download_freq_days int,
  tacho_last_remote_download date,
  tacho_last_manual_download date,
  working_time_rules     text default 'eu',
  -- Operator Licence
  operator_licence       text,
  operator_licence_type  text,
  operator_licence_expiry date,
  operator_licence_area  text,
  operator_licence_auth_vehicles int,
  operating_centre       text,
  transport_manager      text,
  transport_manager_cpc  text,
  -- Insurance & Breakdown
  insurance_policy       text,
  insurance_type         text,
  insurance_expiry       date,
  insurer_name           text,
  insurer_claims_phone   text,
  breakdown_provider     text,
  breakdown_phone        text,
  breakdown_policy       text,
  -- Safety Inspections
  safety_inspection_interval_weeks int,
  safety_inspection_type text,
  last_safety_inspection date,
  next_safety_inspection date,
  annual_test_due        date,
  annual_test_last       date,
  mot_expiry             date,
  vehicle_check_due      date,
  brake_test_date        date,
  brake_test_result      text,
  brake_efficiency_front numeric,
  brake_efficiency_rear  numeric,
  -- Telematics & ADAS
  telematics_fitted      boolean default false,
  telematics_serial      text,
  telematics_imei        text,
  telematics_provider    text,
  cctv_fitted            boolean default false,
  cctv_system            text,
  dvs_side_scan          boolean default false,
  dvs_blind_spot         boolean default false,
  aebs_fitted            boolean default false,
  ldw_fitted             boolean default false,
  -- Maintenance
  last_service_date      date,
  last_service_km        numeric,
  next_service_date      date,
  next_service_km        numeric,
  notes                  text,
  -- Live GPS / Telemetry
  lat                    numeric,
  lng                    numeric,
  speed                  numeric,
  last_seen              timestamptz,
  -- Timestamps
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);
alter table vehicles enable row level security;
create policy if not exists "vehicles_auth_all" on vehicles for all to authenticated using (true) with check (true);
create policy if not exists "vehicles_anon_read" on vehicles for select to anon using (true);
grant select on vehicles to anon;
grant all on vehicles to authenticated;
grant all on vehicles to service_role;

-- ── 3. DRIVERS ────────────────────────────────────────────────
create table if not exists drivers (
  id                uuid primary key default uuid_generate_v4(),
  full_name         text not null,
  employee_id       text,
  email             text,
  phone             text,
  status            text default 'off_duty',
  licence_type      text,
  licence_number    text,
  licence_expiry    date,
  cpc_number        text,
  cpc_expiry        date,
  tacho_card        text,
  tacho_expiry      date,
  safety_score      numeric default 100,
  hours_this_week   numeric default 0,
  vehicle_id        uuid references vehicles(id) on delete set null,
  vehicle_reg       text,
  pin_hash          text,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
alter table drivers enable row level security;
create policy if not exists "drivers_auth_all" on drivers for all to authenticated using (true) with check (true);
create policy if not exists "drivers_anon_read" on drivers for select to anon using (true);
grant select on drivers to anon;
grant all on drivers to authenticated;
grant all on drivers to service_role;

-- ── 4. VEHICLE TELEMETRY ──────────────────────────────────────
create table if not exists vehicle_telemetry (
  id          uuid primary key default uuid_generate_v4(),
  vehicle_id  uuid references vehicles(id) on delete cascade,
  driver_id   uuid references drivers(id) on delete set null,
  driver_name text,
  lat         numeric,
  lng         numeric,
  speed       numeric,
  heading     numeric,
  fuel        numeric,
  engine_on   boolean,
  odometer_km numeric,
  source      text default 'driver_app',
  created_at  timestamptz default now()
);
alter table vehicle_telemetry enable row level security;
create policy if not exists "telemetry_anon_insert" on vehicle_telemetry for insert to anon with check (true);
create policy if not exists "telemetry_auth_all"    on vehicle_telemetry for all   to authenticated using (true) with check (true);
grant insert on vehicle_telemetry to anon;
grant all    on vehicle_telemetry to authenticated;
grant all    on vehicle_telemetry to service_role;

-- ── 5. SAFETY ALERTS ─────────────────────────────────────────
create table if not exists safety_alerts (
  id          uuid primary key default uuid_generate_v4(),
  vehicle_id  uuid references vehicles(id)  on delete set null,
  driver_id   uuid references drivers(id)   on delete set null,
  driver_name text,
  vehicle_reg text,
  type        text not null,
  severity    text default 'medium',
  value       numeric,
  threshold   numeric,
  location    text,
  lat         numeric,
  lng         numeric,
  resolved    boolean default false,
  resolved_at timestamptz,
  resolved_by text,
  notes       text,
  created_at  timestamptz default now()
);
alter table safety_alerts enable row level security;
create policy if not exists "safety_anon_insert" on safety_alerts for insert to anon with check (true);
create policy if not exists "safety_auth_all"    on safety_alerts for all   to authenticated using (true) with check (true);
grant insert on safety_alerts to anon;
grant all    on safety_alerts to authenticated;
grant all    on safety_alerts to service_role;

-- ── 6. DRIVER SCORES ─────────────────────────────────────────
create table if not exists driver_scores (
  id        uuid primary key default uuid_generate_v4(),
  driver_id uuid references drivers(id) on delete cascade,
  date      date default current_date,
  score     numeric default 100,
  events    int default 0,
  notes     text,
  created_at timestamptz default now()
);
alter table driver_scores enable row level security;
create policy if not exists "scores_auth_all" on driver_scores for all to authenticated using (true) with check (true);
grant all on driver_scores to authenticated;
grant all on driver_scores to service_role;

-- ── 7. DRIVER HOURS ──────────────────────────────────────────
create table if not exists driver_hours (
  id           uuid primary key default uuid_generate_v4(),
  driver_id    uuid references drivers(id) on delete cascade,
  date         date default current_date,
  drive_hours  numeric default 0,
  break_minutes int default 0,
  total_duty_hours numeric default 0,
  created_at   timestamptz default now()
);
alter table driver_hours enable row level security;
create policy if not exists "hours_anon_insert" on driver_hours for insert to anon with check (true);
create policy if not exists "hours_auth_all"    on driver_hours for all   to authenticated using (true) with check (true);
grant insert on driver_hours to anon;
grant all    on driver_hours to authenticated;
grant all    on driver_hours to service_role;

-- ── 8. DISPATCH JOBS ─────────────────────────────────────────
create table if not exists dispatch_jobs (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  origin           text,
  destination      text,
  waypoints        jsonb,
  route_polyline   jsonb,
  distance_m       numeric,
  duration_s       numeric,
  priority         text default 'normal',
  status           text default 'pending',
  driver_id        uuid references drivers(id) on delete set null,
  driver_name      text,
  vehicle_id       uuid references vehicles(id) on delete set null,
  vehicle_reg      text,
  scheduled_at     timestamptz,
  assigned_at      timestamptz,
  started_at       timestamptz,
  completed_at     timestamptz,
  cancelled_at     timestamptz,
  cancel_reason    text,
  completion_notes text,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
alter table dispatch_jobs enable row level security;
create policy if not exists "jobs_anon_read"   on dispatch_jobs for select to anon using (status in ('assigned','in_progress'));
create policy if not exists "jobs_anon_update" on dispatch_jobs for update to anon using (status in ('assigned','in_progress')) with check (true);
create policy if not exists "jobs_auth_all"    on dispatch_jobs for all    to authenticated using (true) with check (true);
grant select, update on dispatch_jobs to anon;
grant all on dispatch_jobs to authenticated;
grant all on dispatch_jobs to service_role;

-- ── 9. COMPLIANCE RECORDS ─────────────────────────────────────
create table if not exists compliance_records (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  category     text not null,
  entity_id    uuid,
  entity_type  text,
  entity_name  text,
  status       text default 'pass',
  expiry_date  date,
  issued_date  date,
  notes        text,
  document_url text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table compliance_records enable row level security;
create policy if not exists "compliance_auth_all" on compliance_records for all to authenticated using (true) with check (true);
grant all on compliance_records to authenticated;
grant all on compliance_records to service_role;

-- ── 10. INCIDENTS ─────────────────────────────────────────────
create table if not exists incidents (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  type         text not null,
  severity     text default 'medium',
  status       text default 'open',
  driver_id    uuid references drivers(id)  on delete set null,
  vehicle_id   uuid references vehicles(id) on delete set null,
  driver_name  text,
  vehicle_reg  text,
  location     text,
  lat          numeric,
  lng          numeric,
  description  text,
  injuries     boolean default false,
  property_damage boolean default false,
  third_party  boolean default false,
  police_ref   text,
  witness_info text,
  notes        text,
  resolved_at  timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table incidents enable row level security;
create policy if not exists "incidents_auth_all" on incidents for all to authenticated using (true) with check (true);
grant all on incidents to authenticated;
grant all on incidents to service_role;

-- ── 11. MESSAGE CHANNELS ──────────────────────────────────────
create table if not exists message_channels (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  type        text default 'group',
  description text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);
alter table message_channels enable row level security;
create policy if not exists "channels_auth_all" on message_channels for all to authenticated using (true) with check (true);
grant all on message_channels to authenticated;
grant all on message_channels to service_role;

-- ── 12. MESSAGES ──────────────────────────────────────────────
create table if not exists messages (
  id          uuid primary key default uuid_generate_v4(),
  channel_id  uuid references message_channels(id) on delete cascade,
  driver_id   uuid references drivers(id)   on delete set null,
  sender_id   uuid references auth.users(id) on delete set null,
  sender_name text,
  sender_role text default 'fleet',
  content     text not null,
  read        boolean default false,
  created_at  timestamptz default now()
);
alter table messages enable row level security;
create policy if not exists "messages_anon_insert" on messages for insert to anon with check (true);
create policy if not exists "messages_auth_all"    on messages for all   to authenticated using (true) with check (true);
grant insert on messages to anon;
grant all    on messages to authenticated;
grant all    on messages to service_role;

-- ── 13. AI REPORTS ────────────────────────────────────────────
create table if not exists ai_reports (
  id           uuid primary key default uuid_generate_v4(),
  driver_id    uuid references drivers(id) on delete set null,
  driver_name  text,
  vehicle_id   uuid references vehicles(id) on delete set null,
  vehicle_reg  text,
  type         text not null,
  severity     text default 'low',
  fatigue_score numeric,
  safety_score  numeric,
  summary      text,
  data         jsonb,
  created_at   timestamptz default now()
);
alter table ai_reports enable row level security;
create policy if not exists "ai_reports_anon_insert" on ai_reports for insert to anon with check (true);
create policy if not exists "ai_reports_auth_all"    on ai_reports for all   to authenticated using (true) with check (true);
grant insert on ai_reports to anon;
grant all    on ai_reports to authenticated;
grant all    on ai_reports to service_role;

-- ── 14. LIVE SYNC SESSIONS ────────────────────────────────────
create table if not exists live_sync_sessions (
  id           uuid primary key default uuid_generate_v4(),
  driver_id    uuid references drivers(id) on delete cascade,
  vehicle_id   uuid references vehicles(id) on delete set null,
  token_hash   text unique not null,
  token_used   boolean default false,
  expires_at   timestamptz,
  paired_at    timestamptz,
  last_seen    timestamptz default now(),
  driver_name  text,
  vehicle_reg  text,
  api_keys     jsonb,
  created_at   timestamptz default now()
);
alter table live_sync_sessions enable row level security;
create policy if not exists "sync_anon_insert" on live_sync_sessions for insert to anon with check (true);
create policy if not exists "sync_anon_update" on live_sync_sessions for update to anon using (true) with check (true);
create policy if not exists "sync_auth_all"    on live_sync_sessions for all   to authenticated using (true) with check (true);
grant insert, update, select on live_sync_sessions to anon;
grant all on live_sync_sessions to authenticated;
grant all on live_sync_sessions to service_role;

-- ── Realtime subscriptions ─────────────────────────────────────
alter publication supabase_realtime add table vehicle_telemetry;
alter publication supabase_realtime add table safety_alerts;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table live_sync_sessions;
alter publication supabase_realtime add table dispatch_jobs;

-- ── Done ──────────────────────────────────────────────────────
-- After running this, go to:
-- Authentication > Providers > Email > disable "Confirm email"
-- Then visit your app and complete the first-run setup wizard.
