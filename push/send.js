/* Envía las alertas de Coach Ale por Web Push.
   Pensado para ejecutarse cada 30 min desde GitHub Actions (o cualquier cron).

   Variables de entorno:
     VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY   claves generadas con `npm run keys`
     PUSH_SUBSCRIPTION                     JSON de la suscripción (uno o varios, en array)
   Opcional:
     node send.js --force habits|screens|sueno   → envía ya, ignorando el horario   */
"use strict";
const fs = require("fs");
const path = require("path");
const webpush = require("web-push");

const nube = require("./nube.js");

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
const TZ = cfg.timezone || "America/Santiago";

function setupVapid(){
  const PUB = process.env.VAPID_PUBLIC_KEY, PRIV = process.env.VAPID_PRIVATE_KEY;
  if(!PUB || !PRIV){ console.error("Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY"); process.exit(1); }
  webpush.setVapidDetails(cfg.contacto || "mailto:nadie@example.com", PUB, PRIV);
}

/* --- suscripciones --- */
function loadSubs(){
  const raw = process.env.PUSH_SUBSCRIPTION
    || (fs.existsSync(path.join(__dirname,"subscriptions.json"))
        && fs.readFileSync(path.join(__dirname,"subscriptions.json"),"utf8"));
  if(!raw){
    console.log("Todavía no hay ningún dispositivo suscrito.");
    console.log("Actívalo en la app (Ajustes → App en el celular) y guarda el texto");
    console.log("como el secreto PUSH_SUBSCRIPTION del repositorio.");
    return [];
  }
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [parsed];
}

/* --- hora local según la zona horaria configurada --- */
function localNow(){
  if(process.env.FAKE_NOW){ const [h,m] = process.env.FAKE_NOW.split(":").map(Number); return h*60+m; }
  const f = new Intl.DateTimeFormat("es-CL", {timeZone:TZ, hour:"2-digit", minute:"2-digit", hour12:false});
  const [h,m] = f.format(new Date()).split(":").map(Number);
  return h*60 + m;
}
const hm = s => { const [h,m] = String(s).split(":").map(Number); return h*60 + m; };

function hoyLocal(){
  const f = new Intl.DateTimeFormat("en-CA", {timeZone:TZ, year:"numeric", month:"2-digit", day:"2-digit"});
  return f.format(new Date());                       // AAAA-MM-DD
}
const reloj = t => String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0");

/* ============================================================
   AVISOS DE CADA PERSONA
   Lo de arriba son los avisos generales del entrenador. Esto es lo que
   cada deportista pidió: sus recordatorios, 60 y 30 minutos antes, y el
   aviso del día que le toca entrenar. Sale de sus propios datos.
   ============================================================ */
const AVISOS_MIN = [60, 30];

function avisosDe(datos, config, ahora){
  const out = [];

  /* Recordatorios del día. Se dispara al cruzar el umbral, con la ventana
     del cron de margen: si la franja se salta, el aviso no se repite porque
     cada franja solo cubre sus propios minutos. */
  for(const r of (datos?.recor || [])){
    const faltan = hm(r.hora) - ahora;
    for(const m of AVISOS_MIN){
      if(faltan > m || faltan <= m - VENTANA) continue;
      /* El cron corre cada media hora, así que el aviso casi nunca cae en el
         minuto exacto. Decir "falta una hora" cuando faltan cuarenta y cinco
         minutos —o cinco— es peor que no decir nada: va el tiempo real. */
      const justo = Math.abs(faltan - m) <= 7;
      const titulo = justo
        ? (m === 60 ? "⏰ Falta 1 hora" : "⏰ Faltan 30 minutos")
        : faltan === 1 ? "⏰ Falta 1 minuto" : `⏰ Faltan ${faltan} minutos`;
      out.push({kind:"recor", title:titulo,
                body:`${r.txt} · a las ${r.hora}`,
                tag:`recor-${r.id}-${m}`});
    }
  }

  /* El día de entrenamiento: solo si tiene rutina, si hoy le toca según el
     plan del mes y si todavía no ha anotado ninguna serie. */
  const w = datos?.workout;
  const hechas = (w?.ex || []).some(e =>
    (e.sets || []).some(st => !st.p && Number(st.w) > 0 && Number(st.r) > 0));
  if(cfg.entreno?.activo && !hechas && w?.plan && dentroDe(ahora, cfg.entreno.hora)){
    const dia = (config?.rutina?.dias || []).find(d => d.id === w.dia);
    out.push({kind:"entreno",
      title: "🏋️ Hoy toca entrenar",
      body: dia ? `${dia.nombre} · semana ${w.plan.semana}, ${w.plan.tipo}.`
                : `Semana ${w.plan.semana} de tu plan: ${w.plan.tipo}.`,
      tag: "entreno-" + hoyLocal()});
  }
  return out;
}

/* Envía una tanda a los dispositivos de una persona y limpia los caducados. */
async function enviarA(dispositivos, jobs, cuenta){
  for(const job of jobs){
    for(const d of dispositivos){
      try{
        await webpush.sendNotification(d.sub, JSON.stringify(job));
        cuenta.ok++;
      }catch(err){
        if(err.statusCode === 404 || err.statusCode === 410){
          cuenta.gone++;
          /* El navegador ya la dio por muerta: si no se borra, se reintenta
             en cada franja para siempre. */
          if(d.endpoint && nube.hayNube()) await nube.olvidar(d.endpoint).catch(()=>{});
        }else{
          console.error("Error al enviar:", err.statusCode, err.body || err.message);
          process.exitCode = 1;
        }
      }
    }
  }
}

/* Qué toca enviar en este momento. La ventana es de 30 min para tolerar
   el retraso habitual de los cron de GitHub Actions. */
const VENTANA = 30;
/* Dentro de la franja de este cron. Recibe la hora para que la función sea
   comprobable: si la leyera del reloj por dentro, no habría cómo probarla. */
const dentroDe = (ahora, target) => { const d = ahora - hm(target); return d >= 0 && d < VENTANA; };
const dentro = target => dentroDe(localNow(), target);

function pendientes(){
  const now = localNow(), out = [];

  if(cfg.pantallas?.activo && dentro(cfg.pantallas.hora))
    out.push({kind:"screens",
      title:"🌙 Hora de dejar las pantallas",
      body:`Son las ${cfg.pantallas.hora}. Baja el ritmo y prepara tu descanso: mañana tu puntuación de sueño lo nota.`});

  if(cfg.sueno?.activo && dentro(cfg.sueno.hora))
    out.push({kind:"sueno",
      title:"☀️ Buenos días",
      body:"Registra cómo dormiste para calcular tu puntuación de sueño."});

  if(cfg.habitos?.activo){
    const a = hm(cfg.habitos.desde), b = hm(cfg.habitos.hasta);
    const paso = Math.max(30, cfg.habitos.cadaMinutos || 120);
    for(let t = a; t <= b; t += paso){
      const hh = String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0");
      if(dentro(hh)){
        out.push({kind:"habits",
          title:"Coach Ale 🏋️",
          body:"¿Cómo van tus círculos de hoy? Abre la app y completa lo que falte."});
        break;
      }
    }
  }
  return out;
}

async function main(){
  setupVapid();
  const forceIdx = process.argv.indexOf("--force");
  const ahora = localNow();
  const cuenta = {ok:0, gone:0};

  /* --- prueba manual: va a los dispositivos de siempre --- */
  if(forceIdx > -1){
    const k = process.argv[forceIdx+1] || "habits";
    const job = {kind:k, title:"Coach Ale 🏋️",
                 body:"Notificación de prueba: si ves esto, los avisos funcionan."};
    const propios = loadSubs().map(sub=>({sub}));
    await enviarA(propios, [job], cuenta);
    if(nube.hayNube()){
      const porPersona = await nube.suscripciones();
      for(const [, disp] of porPersona) await enviarA(disp, [job], cuenta);
    }
    console.log(`Prueba enviada · ${cuenta.ok} entregadas · ${cuenta.gone} caducadas`);
    return;
  }

  /* --- avisos generales, a los dispositivos del secreto de siempre --- */
  const generales = pendientes();
  const propios = loadSubs().map(sub=>({sub}));
  if(generales.length && propios.length) await enviarA(propios, generales, cuenta);

  /* --- avisos de cada persona, desde su propia cuenta --- */
  if(!nube.hayNube()){
    console.log("Sin SUPABASE_URL / SUPABASE_SERVICE_KEY: solo se envían los avisos generales.");
  }else{
    try{
      const porPersona = await nube.suscripciones();
      const ids = [...porPersona.keys()];
      if(ids.length){
        const hoy = hoyLocal();
        const [dias, configs] = await Promise.all([nube.diasDe(hoy, ids), nube.configDe(ids)]);
        for(const [id, disp] of porPersona){
          const jobs = avisosDe(dias.get(id), configs.get(id), ahora);
          if(!jobs.length) continue;
          await enviarA(disp, jobs, cuenta);
          console.log(`→ ${id.slice(0,8)}: ${jobs.map(j=>j.kind).join(", ")}`);
        }
      }
      console.log(`${ids.length} persona(s) con avisos activados.`);
    }catch(e){
      console.error("No se pudieron leer los avisos de la nube:", e.message);
      process.exitCode = 1;
    }
  }

  if(generales.length) console.log(`Generales: ${generales.map(j=>j.kind).join(", ")}`);
  console.log(`Hora local ${reloj(ahora)} (${TZ}) · ${cuenta.ok} entregadas · ${cuenta.gone} caducadas`);
}

module.exports = {pendientes, avisosDe, localNow, hoyLocal, hm};
if(require.main === module) main();
