-- ============================================================
--  Coach Ale · apartado médico y nutricional
--  Ejecútalo en Supabase → SQL Editor → New query, DESPUÉS de
--  esquema.sql. Se puede volver a ejecutar sin romper nada.
-- ============================================================

-- ------------------------------------------------------------
-- 1. QUIÉN ES MI ENTRENADOR
--    El deportista necesita poder leer el perfil de su entrenador
--    para saber quién le subió un documento.
-- ------------------------------------------------------------
create or replace function public.mi_coach()
returns uuid language sql stable security definer set search_path = public as $$
  select coach_id from public.perfiles where id = auth.uid();
$$;

drop policy if exists perfil_de_mi_coach on public.perfiles;
create policy perfil_de_mi_coach on public.perfiles
  for select using (id = public.mi_coach());

-- ------------------------------------------------------------
-- 2. DOCUMENTOS · exámenes, informes, pautas
--    El archivo vive en Storage; aquí solo guardamos su ficha.
-- ------------------------------------------------------------
create table if not exists public.documentos (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users on delete cascade,
  autor_id uuid references auth.users on delete set null,
  tipo     text not null default 'medico'
           check (tipo in ('medico','nutricional','otro')),
  titulo   text not null,
  ruta     text not null unique,             -- ruta dentro del bucket
  tam      bigint,
  fecha    date not null default current_date,
  notas    text,
  subido   timestamptz not null default now()
);
alter table public.documentos add column if not exists autor_id uuid references auth.users on delete set null;

create index if not exists documentos_user_idx on public.documentos (user_id, fecha desc);

alter table public.documentos enable row level security;

drop policy if exists docs_propios on public.documentos;
create policy docs_propios on public.documentos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists docs_de_mis_atletas on public.documentos;
create policy docs_de_mis_atletas on public.documentos
  for select using (public.es_mi_atleta(user_id));

-- El entrenador sube informes y pautas a la ficha de sus deportistas, firmando.
drop policy if exists docs_sube_el_equipo on public.documentos;
create policy docs_sube_el_equipo on public.documentos
  for insert with check (public.es_mi_atleta(user_id) and autor_id = auth.uid());

-- Y borra lo suyo, no lo del deportista. Un informe no se edita: se
-- borra y se sube otra vez.
drop policy if exists docs_borra_el_equipo on public.documentos;
create policy docs_borra_el_equipo on public.documentos
  for delete using (public.es_mi_atleta(user_id) and autor_id = auth.uid());

-- ------------------------------------------------------------
-- 3. ALMACÉN PRIVADO
--    Sin `public`, los archivos solo se abren con un enlace
--    firmado que caduca. No hay dirección adivinable.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 15728640,
        array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------
-- 4. PERMISOS DEL ALMACÉN
--    Lo que sube el deportista va en documentos/<su_id>/<archivo>.
--    Lo que sube el entrenador va un nivel más adentro,
--    documentos/<atleta_id>/<autor_id>/<archivo>, y así la propia
--    ruta dice quién puede borrarlo.
-- ------------------------------------------------------------
drop policy if exists docs_leer_propio on storage.objects;
create policy docs_leer_propio on storage.objects
  for select using (
    bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists docs_leer_de_mis_atletas on storage.objects;
create policy docs_leer_de_mis_atletas on storage.objects
  for select using (
    bucket_id = 'documentos' and public.es_mi_atleta(((storage.foldername(name))[1])::uuid));

drop policy if exists docs_subir_propio on storage.objects;
create policy docs_subir_propio on storage.objects
  for insert with check (
    bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists docs_borrar_propio on storage.objects;
create policy docs_borrar_propio on storage.objects
  for delete using (
    bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists docs_subir_para_mis_atletas on storage.objects;
create policy docs_subir_para_mis_atletas on storage.objects
  for insert with check (
    bucket_id = 'documentos'
    and public.es_mi_atleta(((storage.foldername(name))[1])::uuid)
    and (storage.foldername(name))[2] = auth.uid()::text);

drop policy if exists docs_borrar_lo_que_subi on storage.objects;
create policy docs_borrar_lo_que_subi on storage.objects
  for delete using (
    bucket_id = 'documentos' and (storage.foldername(name))[2] = auth.uid()::text);
