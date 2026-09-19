-- ============================================================
-- Coach Ale · avisos con la app cerrada
-- ------------------------------------------------------------
-- Cada dispositivo que activa los avisos guarda aquí su
-- suscripción de Web Push. El envío corre desde GitHub Actions
-- y recorre esta tabla, así que ya no hace falta que nadie copie
-- un JSON a mano ni que haya una sola persona avisada.
--
-- Cómo aplicarlo: Supabase → SQL Editor → pegar y Run.
-- ============================================================

create table if not exists public.suscripciones (
  user_id   uuid not null references auth.users on delete cascade,
  endpoint  text primary key,
  datos     jsonb not null,
  agente    text,
  creada    timestamptz not null default now(),
  usada     timestamptz
);

create index if not exists suscripciones_user on public.suscripciones(user_id);

alter table public.suscripciones enable row level security;

-- Cada persona administra las suscripciones de sus propios dispositivos.
-- El envío desde el servidor usa la clave de servicio, que no pasa por aquí.
drop policy if exists suscripciones_propias on public.suscripciones;
create policy suscripciones_propias on public.suscripciones
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
