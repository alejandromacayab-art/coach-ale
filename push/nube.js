/* Lectura de Supabase para el envío de avisos.
   Usa la clave de servicio, que solo existe como secreto de GitHub Actions:
   nunca va en el repositorio ni llega al navegador. Solo lee; lo único que
   escribe es borrar una suscripción que el navegador ya dio por caducada. */
"use strict";

const URL_BASE = process.env.SUPABASE_URL;
const CLAVE    = process.env.SUPABASE_SERVICE_KEY;

const hayNube = () => !!(URL_BASE && CLAVE);

async function api(ruta, opciones = {}){
  const r = await fetch(`${URL_BASE}/rest/v1/${ruta}`, {
    ...opciones,
    headers: {
      apikey: CLAVE,
      Authorization: `Bearer ${CLAVE}`,
      "Content-Type": "application/json",
      ...(opciones.headers || {})
    }
  });
  if(!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? null : r.json();
}

/* Todas las suscripciones, agrupadas por persona: alguien puede tener el
   teléfono y la tablet. */
async function suscripciones(){
  const filas = await api("suscripciones?select=user_id,endpoint,datos");
  const porPersona = new Map();
  for(const f of filas){
    if(!porPersona.has(f.user_id)) porPersona.set(f.user_id, []);
    porPersona.get(f.user_id).push({endpoint: f.endpoint, sub: f.datos});
  }
  return porPersona;
}

/* El día de hoy de cada persona que tenga algún dispositivo avisado. */
async function diasDe(fecha, ids){
  if(!ids.length) return new Map();
  const lista = ids.map(encodeURIComponent).join(",");
  const filas = await api(`dias?select=user_id,datos&fecha=eq.${fecha}&user_id=in.(${lista})`);
  return new Map(filas.map(f => [f.user_id, f.datos || {}]));
}

/* La configuración —rutina, objetivo— de esas mismas personas. */
async function configDe(ids){
  if(!ids.length) return new Map();
  const lista = ids.map(encodeURIComponent).join(",");
  const filas = await api(`config?select=user_id,datos&user_id=in.(${lista})`);
  return new Map(filas.map(f => [f.user_id, f.datos || {}]));
}

async function olvidar(endpoint){
  await api(`suscripciones?endpoint=eq.${encodeURIComponent(endpoint)}`, {method: "DELETE"});
}

module.exports = {hayNube, suscripciones, diasDe, configDe, olvidar};
