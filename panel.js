/* ============================================================
   Coach Ale · panel del entrenador
   Solo lectura: aquí no se modifica el registro de nadie.
   ============================================================ */
"use strict";

let perfil = null, atletas = [], invs = [];
let canal = null, vista = {tipo:"lista", id:null}, refrescoTimer = null, enVivo = false;
const $ = id => document.getElementById(id);
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kg  = n => Math.round(Number(n)||0).toLocaleString("es-CL");
const MESES=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function toast(m){
  const t=$("toast"); t.textContent=m; t.classList.add("show");
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove("show"),1800);
}
function hoyKey(d=new Date()){
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function diasDesde(fecha){
  if(!fecha) return null;
  return Math.floor((new Date(hoyKey()) - new Date(fecha)) / 86400000);
}
function fechaCorta(f){
  if(!f) return "—";
  const [y,m,d] = f.split("-").map(Number);
  return `${d} ${MESES[m-1]}`;
}
const iniciales = n => String(n||"?").trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase();

/* ---------------- semáforos ---------------- */
function estadoActividad(dias){
  if(dias === null)  return {t:"nunca entró", c:"#6f7887"};
  if(dias <= 1)      return {t:"al día",      c:"#22e07a"};
  if(dias <= 3)      return {t:`hace ${dias} días`, c:"#22e07a"};
  if(dias <= 7)      return {t:`hace ${dias} días`, c:"#fbbf24"};
  return {t:`hace ${dias} días`, c:"#fb7185"};
}
function colorSueno(n){ return !n ? "#6f7887" : n >= 70 ? "#22e07a" : n >= 50 ? "#fbbf24" : "#fb7185"; }

/* ============================================================
   LISTA DE DEPORTISTAS
   ============================================================ */
async function verLista(){
  vista = {tipo:"lista", id:null};
  if(!document.querySelector(".tabla")) $("main").innerHTML = `<div class="empty">Cargando deportistas…</div>`;
  try{
    atletas = await Nube.misAtletas();
  }catch(e){ $("main").innerHTML = `<div class="empty">${esc(Nube.traduce(e.message))}</div>`; return; }

  const n = atletas.length;
  const kgTot   = atletas.reduce((a,x)=>a+Number(x.kg_30d||0),0);
  const ses     = atletas.reduce((a,x)=>a+Number(x.sesiones_30d||0),0);
  const conSue  = atletas.filter(x=>x.sueno_30d);
  const sueMed  = conSue.length ? Math.round(conSue.reduce((a,x)=>a+Number(x.sueno_30d),0)/conSue.length) : 0;
  const activos = atletas.filter(x=>{ const d=diasDesde(x.ultimo_registro); return d!==null && d<=3; }).length;

  $("main").innerHTML = `
    <section>
      <div class="stitle">Resumen del grupo · últimos 30 días</div>
      <div class="stats">
        <div class="stat"><b>${n}</b><span>Deportistas</span></div>
        <div class="stat"><b style="color:${activos===n&&n?'#22e07a':'#fbbf24'}">${activos}/${n}</b><span>Al día (3 días o menos)</span></div>
        <div class="stat"><b>${kg(kgTot)}</b><span>Kg movidos entre todos</span></div>
        <div class="stat"><b>${ses}</b><span>Sesiones de fuerza</span></div>
        <div class="stat"><b style="color:${colorSueno(sueMed)}">${sueMed||"–"}</b><span>Sueño promedio</span></div>
      </div>
    </section>

    <section>
      <div class="stitle">Mis deportistas</div>
      <div class="panel scroll">
        ${n ? `<table class="tabla">
          <thead><tr>
            <th>Deportista</th>
            <th>Actividad</th>
            <th class="ocultar-movil">Kg · 30 d</th>
            <th class="ocultar-movil">Sesiones</th>
            <th>Sueño</th>
          </tr></thead>
          <tbody>
            ${atletas.map(a=>{
              const d = diasDesde(a.ultimo_registro), act = estadoActividad(d);
              return `<tr data-id="${a.id}">
                <td><div class="who"><div class="ava">${esc(iniciales(a.nombre))}</div>
                  <div style="min-width:0"><b>${esc(a.nombre||a.correo)}</b>
                  <span>${esc(a.correo||"")}</span></div></div></td>
                <td><span class="num" style="color:${act.c}">${act.t}</span>
                    <div class="sub">${a.dias_con_registro||0} días con registro</div></td>
                <td class="ocultar-movil"><span class="num">${kg(a.kg_30d)}</span> <span class="sub">kg</span></td>
                <td class="ocultar-movil"><span class="num">${a.sesiones_30d||0}</span>
                    <div class="sub">${((a.sesiones_30d||0)/30*7).toFixed(1)}/sem</div></td>
                <td><span class="num" style="color:${colorSueno(a.sueno_30d)}">${a.sueno_30d||"–"}</span></td>
              </tr>`;
            }).join("")}
          </tbody></table>`
        : `<div class="empty">Todavía no tienes deportistas.<br>Invita al primero para empezar.</div>`}
      </div>
      <button class="btn" style="margin-top:12px" id="invitar">+ Invitar deportista</button>
    </section>`;

  document.querySelectorAll("[data-id]").forEach(tr=>tr.onclick=()=>verAtleta(tr.dataset.id));
  $("invitar").onclick = abrirInvitar;
}

/* ============================================================
   SALUD · lo que ve el entrenador
   Los mismos grupos y el mismo orden que la app: entrenador y deportista
   leen la ficha igual. Si cambia allá, cambia aquí.
   ============================================================ */
const TIPOS_DOC = {medico:{e:"🩺", l:"Médico"}, nutricional:{e:"🥗", l:"Nutricional"}, otro:{e:"📄", l:"Otro"}};
const FICHA_MED = [
  {g:"Identificación y contacto", c:[
    ["nacimiento","Fecha de nacimiento","date"], ["grupo","Grupo sanguíneo"],
    ["estatura","Estatura","cm"], ["prevision","Previsión o seguro"],
    ["contacto","Contacto de emergencia"], ["contacto2","Segundo contacto"],
    ["tratante","Médico o kinesiólogo tratante"]]},
  {g:"Alergias", c:[
    ["alergiaMed","A medicamentos","!"], ["alergiaAlim","Alimentarias","!"], ["alergias","Otras alergias"]]},
  {g:"Antecedentes médicos", c:[
    ["condiciones","Condiciones diagnosticadas"], ["cirugias","Cirugías y hospitalizaciones"],
    ["conmociones","Golpes en la cabeza o conmociones"], ["respiratorio","Problemas respiratorios con el ejercicio"]]},
  {g:"Tamizaje cardiovascular", c:[
    ["cvDolor","Dolor u opresión en el pecho al esforzarse","sn"],
    ["cvDesmayo","Desmayos o mareos con el ejercicio","sn"],
    ["cvAhogo","Falta de aire o fatiga antes que sus pares","sn"],
    ["cvSoplo","Soplo o presión alta detectados","sn"],
    ["cvFamiliar","Muerte súbita familiar antes de los 50","sn"]]},
  {g:"Medicación y sustancias", c:[
    ["medicacion","Medicación habitual"], ["medicacionOcas","Medicación ocasional"],
    ["tue","Autorización de uso terapéutico"], ["habitos","Tabaco y alcohol"]]},
  {g:"Lesiones", c:[
    ["lesiones","Lesiones previas"], ["lesionActual","Molestia o lesión activa","!"],
    ["limitaciones","Movimientos o cargas a evitar","!"]]},
  {g:"Controles y certificados", c:[
    ["ultimoControl","Último control médico deportivo","date"], ["ecg","Electrocardiograma"],
    ["sangre","Último examen de sangre"], ["certificaVence","Vence el certificado de aptitud","date"],
    ["vacunas","Vacunas relevantes"]]}
];
const FICHA_NUT = [
  {g:"Alimentación", c:[
    ["restricciones","Restricciones e intolerancias","!"], ["suplementos","Suplementos"],
    ["objetivoNutri","Objetivo nutricional"], ["notasNutri","Indicaciones del nutricionista"]]}
];
const SN = {si:"Sí", no:"No", nose:"No lo sé"};
const lleno = v => String(v ?? "").trim() !== "";
const un1 = n => Math.round(Number(n)*10)/10;
const pesoArchivo = b => !b ? "" : b >= 1048576 ? (b/1048576).toFixed(1)+" MB" : Math.max(1, Math.round(b/1024))+" KB";
const faltan = f => Math.round((new Date(f+"T00:00:00") - new Date(hoyKey()+"T00:00:00")) / 86400000);
const fechaLargaP = f => {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(f))) return f;
  const [y,m,d] = f.split("-").map(Number);
  return `${d} ${MESES[m-1]} ${y}`;
};
function edadP(f){
  const [y,m,d] = f.split("-").map(Number), h = new Date();
  let a = h.getFullYear() - y, dm = (h.getMonth()+1) - m;
  if(dm < 0 || (dm === 0 && h.getDate() < d)) a--;
  return a;
}
function valorFichaP(v, tipo, k){
  if(tipo === "sn")   return SN[v] || v;
  if(tipo === "date") return k === "nacimiento" ? `${fechaLargaP(v)} · ${edadP(v)} años` : fechaLargaP(v);
  if(tipo === "cm")   return v + " cm";
  return v;
}
/* Lo que hay que saber sin abrir la ficha entera. */
function banderasP(salud){
  const f = salud || {}, out = [];
  FICHA_MED.flatMap(s=>s.c).filter(([k,,t]) => t === "sn" && f[k] === "si")
    .forEach(([,l]) => out.push({t:"alta", txt:l}));
  if(lleno(f.alergiaMed))   out.push({t:"alta",  txt:"Alergia a medicamentos: " + f.alergiaMed});
  if(lleno(f.alergiaAlim))  out.push({t:"media", txt:"Alergia alimentaria: " + f.alergiaAlim});
  if(lleno(f.lesionActual)) out.push({t:"media", txt:"Lesión activa: " + f.lesionActual});
  if(lleno(f.limitaciones)) out.push({t:"media", txt:"Evitar: " + f.limitaciones});
  if(lleno(f.contacto))     out.push({t:"info",  txt:"Emergencia: " + f.contacto});
  if(lleno(f.certificaVence)){
    const n = faltan(f.certificaVence);
    if(n < 0)        out.push({t:"alta",  txt:`Certificado de aptitud vencido hace ${-n} días`});
    else if(n <= 30) out.push({t:"media", txt:`El certificado de aptitud vence en ${n} días`});
  }
  return out;
}
function banderasHTML(salud){
  const bs = banderasP(salud);
  if(!bs.length) return "";
  return `<div class="flags">${bs.map(b=>
    `<div class="flag ${b.t}"><span>${b.t === "alta" ? "🚨" : b.t === "media" ? "⚠️" : "📞"}</span>${esc(b.txt)}</div>`
  ).join("")}</div>`;
}
function fichaHTML(salud, secs){
  const cuerpo = secs.map(sec=>{
    const llenos = sec.c.filter(([k]) => lleno(salud?.[k]));
    if(!llenos.length) return "";
    return `<div class="fcgrupo">${sec.g}</div>` + llenos.map(([k,l,t])=>{
      const rojo = t === "sn" ? salud[k] === "si" : t === "!";
      return `<div class="fcrow"><span>${l}</span>
        <b${rojo ? ' style="color:#fb7185"' : ""}>${esc(valorFichaP(salud[k], t, k))}</b></div>`;
    }).join("");
  }).join("");
  return cuerpo ? `<div class="panel">${cuerpo}</div>` : "";
}
/* La medición más reciente y la más cercana a 30 días atrás, para el delta. */
function medicionesDe(dias){
  const ms = dias.filter(r=>Number(r.datos?.cuerpo?.peso) > 0)
                 .map(r=>({fecha:r.fecha, ...r.datos.cuerpo}))
                 .sort((a,b)=> b.fecha.localeCompare(a.fecha));
  const limite = hoyKey(new Date(Date.now() - 30*86400000));
  return {ultima: ms[0] || null, antes: ms.find(m=>m.fecha <= limite) || null, todas: ms};
}
function deltaTxt(actual, antes, mejorSube){
  if(!antes || !Number(antes)) return {t:"—", c:"#6f7887"};
  const d = un1(actual - antes);
  if(d === 0) return {t:"sin cambio", c:"#6f7887"};
  const bueno = mejorSube === null ? null : (mejorSube ? d > 0 : d < 0);
  return {t:`${d>0?"▲":"▼"} ${Math.abs(d)}`,
          c: bueno === null ? "#a7b2c2" : bueno ? "#22e07a" : "#fb7185"};
}

/* ============================================================
   FICHA DE UN DEPORTISTA
   ============================================================ */
async function verAtleta(id){
  const a = atletas.find(x=>x.id === id);
  const mismaFicha = vista.tipo === "ficha" && vista.id === id;
  vista = {tipo:"ficha", id};
  if(!mismaFicha) $("main").innerHTML = `<div class="empty">Cargando ficha…</div>`;
  let dias = [], salud = null, documentos = [], docsError = "";
  try{
    const desde = new Date(); desde.setDate(desde.getDate()-45);
    dias = await Nube.diasDe(id, hoyKey(desde));
    const cfg = await Nube.configDe(id);
    salud = cfg?.salud || null;
  }catch(e){ $("main").innerHTML = `<div class="empty">${esc(Nube.traduce(e.message))}</div>`; return; }
  try{ documentos = await Nube.docs(id); }
  catch(e){ docsError = Nube.traduce(e.message); }
  const med = medicionesDe(dias);
  const fMed = fichaHTML(salud, FICHA_MED), fNut = fichaHTML(salud, FICHA_NUT);

  const vol = d => Number(d?.workout?.volume || 0);
  const mn  = v => (v && typeof v === "object") ? (Number(v.min)||0) : (Number(v)||0);
  const km2 = v => (v && typeof v === "object") ? (Number(v.km)||0)  : 0;
  const act = d => Object.values(d?.actividad?.items || {}).reduce((a,v)=>a+mn(v), 0);
  const actKm = d => Object.values(d?.actividad?.items || {}).reduce((a,v)=>a+km2(v), 0);
  const sesiones = dias.filter(r=>vol(r.datos)>0);
  const kgTot = dias.reduce((s,r)=>s+vol(r.datos),0);
  const sue = dias.filter(r=>r.datos?.sleep).map(r=>r.datos.sleep);
  const sueMed = sue.length ? Math.round(sue.reduce((s,x)=>s+x.score,0)/sue.length) : 0;
  const hMed = sue.length ? (sue.reduce((s,x)=>s+x.hours,0)/sue.length).toFixed(1) : 0;
  const maxVol = Math.max(1, ...dias.map(r=>vol(r.datos)));

  const ult14 = [];
  for(let i=13;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const f = hoyKey(d);
    ult14.push({f, r: dias.find(x=>x.fecha===f)});
  }

  $("main").innerHTML = `
    <a class="volver" id="volver">‹ Todos los deportistas</a>
    <div class="hero" style="margin-top:6px">
      <div class="ava" style="width:64px;height:64px;border-radius:18px;font-size:22px">${esc(iniciales(a?.nombre))}</div>
      <div class="hero-info">
        <h2>${esc(a?.nombre || "Deportista")}</h2>
        <p>${esc(a?.correo||"")}</p>
        <div class="chips">
          <span class="chip">Último registro: ${fechaCorta(a?.ultimo_registro)}</span>
          <span class="chip">${dias.length} días registrados en 45</span>
        </div>
      </div>
    </div>

    ${banderasHTML(salud)}

    ${med.ultima ? `<section>
      <div class="stitle">⚖️ Composición corporal</div>
      <div class="stats">
        <div class="stat"><b style="color:#2dd4bf">${un1(med.ultima.peso)}</b><span>Peso (kg) · ${fechaCorta(med.ultima.fecha)}</span></div>
        <div class="stat"><b style="color:${deltaTxt(med.ultima.peso, med.antes?.peso, null).c}">${
          deltaTxt(med.ultima.peso, med.antes?.peso, null).t}</b><span>Peso vs 30 d</span></div>
        ${Number(med.ultima.grasa) ? `<div class="stat"><b>${un1(med.ultima.grasa)}%</b><span>Grasa · ${
          un1(med.ultima.peso*med.ultima.grasa/100)} kg</span></div>
        <div class="stat"><b style="color:${deltaTxt(Number(med.ultima.grasa), Number(med.antes?.grasa), false).c}">${
          deltaTxt(Number(med.ultima.grasa), Number(med.antes?.grasa), false).t}</b><span>Grasa vs 30 d</span></div>` : ""}
        ${Number(med.ultima.musculo) ? `<div class="stat"><b>${un1(med.ultima.musculo)}%</b><span>Músculo · ${
          un1(med.ultima.peso*med.ultima.musculo/100)} kg</span></div>
        <div class="stat"><b style="color:${deltaTxt(Number(med.ultima.musculo), Number(med.antes?.musculo), true).c}">${
          deltaTxt(Number(med.ultima.musculo), Number(med.antes?.musculo), true).t}</b><span>Músculo vs 30 d</span></div>` : ""}
      </div>
      ${med.ultima.nota ? `<p style="font-size:12.5px;color:#6f7887;margin:10px 0 0">${esc(med.ultima.nota)}</p>` : ""}
    </section>` : ""}

    <section>
      <div class="stitle">Cargas · últimos 45 días</div>
      <div class="stats">
        <div class="stat"><b>${kg(kgTot)}</b><span>Kg totales</span></div>
        <div class="stat"><b>${sesiones.length}</b><span>Sesiones</span></div>
        <div class="stat"><b>${sesiones.length?kg(kgTot/sesiones.length):0}</b><span>Kg por sesión</span></div>
        <div class="stat"><b style="color:${colorSueno(sueMed)}">${sueMed||"–"}</b><span>Sueño · ${hMed||"–"} h</span></div>
        <div class="stat"><b style="color:#fb923c">${dias.reduce((s,r)=>s+act(r.datos),0)}</b><span>Min de actividad</span></div>
        <div class="stat"><b style="color:#fb923c">${Math.round(dias.reduce((s,r)=>s+actKm(r.datos),0)*10)/10}</b><span>Km recorridos</span></div>
      </div>
      <div class="panel" style="margin-top:12px">
        <div class="chart">
          ${ult14.map(x=>{
            const v = vol(x.r?.datos), alt = v ? Math.max(4, v/maxVol*100) : 3;
            return `<div class="cb" title="${x.f}${v?` · ${kg(v)} kg`:""}">
              <div class="cbar ${v?"":"empty"}" style="height:${alt}%"></div>
              <div class="cbl">${Number(x.f.slice(8))}</div></div>`;
          }).join("")}
        </div>
        <div class="hlbl"><span>Volumen por día · últimos 14 días</span></div>
      </div>
    </section>

    ${fMed ? `<section><div class="stitle">🩺 Ficha médica</div>${fMed}</section>` : ""}
    ${fNut ? `<section><div class="stitle">🥗 Ficha nutricional</div>${fNut}</section>` : ""}

    <section>
      <div class="stitle">📎 Documentos</div>
      <div class="panel">${
        docsError ? `<div class="empty">${esc(docsError)}</div>`
        : !documentos.length ? `<div class="empty">Sin documentos cargados.</div>`
        : documentos.map(d=>{
            const t = TIPOS_DOC[d.tipo] || TIPOS_DOC.otro;
            const mio = d.autor_id && d.autor_id === perfil?.id;
            const quien = !d.autor_id ? "lo subió el deportista"
                        : mio ? "lo subiste tú"
                        : esc(String(d.autor?.nombre || "el deportista").split(" ")[0]);
            return `<div class="hrow">
              <div class="m">${t.e}</div>
              <div class="t"><b>${esc(d.titulo)}</b>
                <span>${t.l} · ${fechaCorta(d.fecha)}${d.tam ? " · "+pesoArchivo(d.tam) : ""} · ${quien}</span></div>
              <button class="mini" data-doc="${esc(d.ruta)}">Abrir</button>
              ${mio ? `<button class="mini" data-borrar-doc="${d.id}" style="color:#fb7185">✕</button>` : ""}
            </div>${d.notas ? `<p style="font-size:12px;color:#6f7887;margin:0 0 10px 45px">${esc(d.notas)}</p>` : ""}`;
          }).join("")}</div>
      ${docsError ? "" : `<button class="mini" style="margin-top:12px" id="subirDoc">+ Subir documento para ${esc(String(a?.nombre||"").split(" ")[0])}</button>
        <input type="file" id="docFile" accept="application/pdf,image/png,image/jpeg,image/webp" style="display:none">`}
    </section>

    <section>
      <div class="stitle">Registro día a día</div>
      ${dias.length ? dias.map(r=>{
        const d = r.datos||{}, v = vol(d), s = d.sleep;
        const ejercicios = (d.workout?.ex||[]).filter(e=>(e.sets||[]).some(x=>Number(x.w)&&Number(x.r)));
        const acts = Object.entries(d.actividad?.items||{}).filter(([,v])=>mn(v)>0||km2(v)>0);
        if(!v && !s && !ejercicios.length && !d.note && !acts.length) return "";
        return `<div class="dcard">
          <div class="dhead">
            <b>${fechaCorta(r.fecha)}</b>
            ${s ? `<span class="pill" style="color:${colorSueno(s.score)}">😴 ${s.score} · ${s.hours} h</span>` : ""}
            ${act(d) ? `<span class="pill" style="color:#fb923c">🏃 ${act(d)} min${actKm(d)?` · ${actKm(d)} km`:""}</span>` : ""}
            ${v ? `<span class="pill" style="color:#4ade80">🏋️ ${kg(v)} kg</span>` : ""}
          </div>
          ${ejercicios.map(e=>`<div class="ex"><b>${esc(e.name||"Ejercicio")}</b> · ${
            (e.sets||[]).filter(x=>Number(x.w)&&Number(x.r))
              .map(x=>`${x.w}×${x.r}`).join("  ·  ")}</div>`).join("")}
          ${acts.length ? `<div class="ex">${acts.map(([k,v])=>
              `${esc(k)} <b>${mn(v)}′</b>${km2(v)?` · <b>${km2(v)} km</b>`:""}`).join(" · ")}</div>` : ""}
          ${d.workout?.note ? `<div class="ex" style="color:var(--tx3);font-style:italic">“${esc(d.workout.note)}”</div>` : ""}
          ${d.note ? `<div class="ex" style="color:var(--tx3)">📝 ${esc(d.note)}</div>` : ""}
        </div>`;
      }).join("") : `<div class="empty">Sin registros todavía.</div>`}
    </section>`;

  document.querySelectorAll("[data-doc]").forEach(b => b.onclick = async ()=>{
    b.disabled = true; b.textContent = "…";
    try{ window.open(await Nube.urlDoc(b.dataset.doc), "_blank", "noopener"); }
    catch(e){ toast(Nube.traduce(e.message)); }
    finally{ b.disabled = false; b.textContent = "Abrir"; }
  });
  document.querySelectorAll("[data-borrar-doc]").forEach(b => b.onclick = async ()=>{
    const d = documentos.find(x=>x.id === b.dataset.borrarDoc);
    if(!confirm(`¿Eliminar "${d.titulo}"? El deportista dejará de verlo.`)) return;
    try{ await Nube.borrarDoc(d); toast("Documento eliminado"); verAtleta(id); }
    catch(e){ toast(Nube.traduce(e.message)); }
  });
  const sub = $("subirDoc");
  if(sub){
    sub.onclick = ()=> $("docFile").click();
    $("docFile").onchange = async e=>{
      const f = e.target.files?.[0]; e.target.value = "";
      if(!f) return;
      if(f.size > 15*1024*1024){ toast("El archivo pesa más de 15 MB"); return; }
      const titulo = prompt("Título del documento:", f.name.replace(/\.[^.]+$/, "").slice(0,80));
      if(!titulo) return;
      sub.disabled = true; sub.textContent = "Subiendo…";
      try{
        await Nube.subirDoc(f, {titulo, tipo:"medico", atletaId:id});
        toast("Documento subido");
        verAtleta(id);
      }catch(err){ toast(Nube.traduce(err.message)); }
      finally{ sub.disabled = false; sub.textContent = "+ Subir documento"; }
    };
  }
  $("volver").onclick = verLista;
  if(!mismaFicha) window.scrollTo({top:0});
}

/* ============================================================
   INVITACIONES
   ============================================================ */
async function abrirInvitar(){
  $("invModal").classList.add("open");
  await pintarInvitaciones();
}
async function pintarInvitaciones(){
  try{ invs = await Nube.invitaciones(); }catch(e){ invs = []; }
  $("invList").innerHTML = invs.length
    ? `<div class="stitle">Nombres reservados</div>` + invs.map(i=>`
        <div class="hrow">
          <div class="m">${i.usada ? "✅" : "⏳"}</div>
          <div class="t"><b>${esc(i.nombre||i.correo)}</b>
            <span>${esc(i.correo)} · ${i.usada ? "ya entró" : "pendiente"}</span></div>
          <button class="mini" data-quitar="${esc(i.correo)}">Quitar</button>
        </div>`).join("")
    : `<div class="empty" style="padding:18px">Sin nombres reservados.</div>`;
  document.querySelectorAll("[data-quitar]").forEach(b=>b.onclick=async ()=>{
    if(!confirm(`¿Quitar la invitación de ${b.dataset.quitar}?`)) return;
    try{ await Nube.quitarInvitacion(b.dataset.quitar); toast("Invitación quitada"); pintarInvitaciones(); }
    catch(e){ toast(Nube.traduce(e.message)); }
  });
}
$("invSave").onclick = async ()=>{
  const c = $("invMail").value.trim(), n = $("invName").value.trim();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)){ toast("Escribe un correo válido"); return; }
  try{
    await Nube.invitar(c, n);
    $("invMail").value = ""; $("invName").value = "";
    toast("Nombre reservado para ese correo.");
    await pintarInvitaciones();
  }catch(e){ toast(Nube.traduce(e.message)); }
};
document.getElementById("copiarEnlace").onclick = async ()=>{
  const t = document.getElementById("enlaceReg").textContent.trim();
  try{ await navigator.clipboard.writeText(t); toast("Enlace copiado"); }
  catch(e){ toast("Selecciona y copia el enlace de arriba"); }
};
$("invClose").onclick = ()=>{ $("invModal").classList.remove("open"); verLista(); };
$("invModal").onclick = e=>{ if(e.target.id==="invModal"){ $("invModal").classList.remove("open"); verLista(); } };

/* ============================================================
   CAMBIOS EN VIVO
   La base avisa al panel en cuanto un deportista guarda algo.
   ============================================================ */
function pintarVivo(on){
  enVivo = on;
  const p = $("vivo");
  if(!p) return;
  p.classList.toggle("on", on);
  $("vivoTxt").textContent = on ? "en vivo" : "sin conexión";
}

function conectarEnVivo(){
  canal = Nube.escuchar(
    uid => { clearTimeout(refrescoTimer); refrescoTimer = setTimeout(()=>refrescar(uid), 1200); },
    estado => pintarVivo(estado === "SUBSCRIBED")
  );
}

async function refrescar(uid){
  if(vista.tipo === "lista"){
    const antes = JSON.stringify(atletas.find(a=>a.id===uid) || null);
    await verLista();
    const fila = document.querySelector(`[data-id="${uid}"]`);
    if(fila && antes !== JSON.stringify(atletas.find(a=>a.id===uid) || null)){
      fila.classList.add("cambio");
      setTimeout(()=>fila.classList.remove("cambio"), 2200);
    }
  }else if(vista.tipo === "ficha" && vista.id === uid){
    const y = window.scrollY;
    await verAtleta(uid);
    window.scrollTo({top:y});
    toast("Actualizado recién");
  }
}

/* ============================================================
   ACCESO Y ARRANQUE
   ============================================================ */
function mostrarLogin(v){ $("login").classList.toggle("hidden", !v); }

$("go").onclick = async ()=>{
  const c = $("mail").value.trim(), p = $("pass").value;
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)){ toast("Escribe un correo válido"); return; }
  if(!p){ toast("Escribe tu contraseña"); return; }
  $("go").disabled = true; $("go").textContent = "Entrando…";
  try{ await Nube.entrar(c, p); location.reload(); }
  catch(e){ toast(e.message); }
  finally{ $("go").disabled = false; $("go").textContent = "Entrar"; }
};
["mail","pass"].forEach(i=>$(i).addEventListener("keydown", e=>{ if(e.key==="Enter") $("go").click(); }));

$("themeBtn").onclick = ()=>{
  const d = document.documentElement.dataset.theme === "dark";
  document.documentElement.dataset.theme = d ? "light" : "dark";
  $("themeBtn").textContent = d ? "🌙" : "☀️";
  try{ const w = JSON.parse(localStorage.getItem("wellness.v1")||"{}"); w.theme = d?"light":"dark";
       localStorage.setItem("wellness.v1", JSON.stringify(w)); }catch(e){}
};

(async function init(){
  try{ const w = JSON.parse(localStorage.getItem("wellness.v1")||"{}");
       if(w.theme) document.documentElement.dataset.theme = w.theme; }catch(e){}

  if(!Nube.activa()){
    $("main").innerHTML = `<div class="empty">
      El panel todavía no está conectado a la base de datos.<br>
      Falta completar <b>config.js</b> con los datos de Supabase.</div>`;
    return;
  }
  const s = await Nube.sesion();
  if(!s){ mostrarLogin(true); $("cargando").remove(); return; }
  mostrarLogin(false);

  try{ perfil = await Nube.miPerfil(); }
  catch(e){ $("main").innerHTML = `<div class="empty">${esc(Nube.traduce(e.message))}</div>`; return; }

  if(!perfil || perfil.rol !== "coach"){
    $("main").innerHTML = `<div class="empty">
      Este panel es solo para el entrenador.<br><br>
      <a class="btn" style="display:inline-block;text-decoration:none;width:auto;padding:12px 20px"
         href="index.html">Ir a mi registro</a></div>`;
    return;
  }
  await verLista();
  conectarEnVivo();
  Nube.alCambiarSesion(s=>{ if(!s) location.reload(); });
  addEventListener("beforeunload", ()=>Nube.dejarDeEscuchar(canal));
})();
