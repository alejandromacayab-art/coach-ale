/* PALANCA · la lista, el cuerpo y el puente con Coach Ale.
   El motor de cálculo es compartido: vive un nivel más arriba porque lo
   usan esta app y la de entrenamiento, y tener dos copias era garantizar
   que un día dejaran de dar el mismo número. */

const BIO = window.COACH_ALE_BIOMECANICA;
const MOD = window.COACH_ALE_MODELOS;
const EJ  = (window.COACH_ALE_EJERCICIOS || {}).lista;
const GRAF = window.COACH_ALE_GRAFICO;

/* Son cinco archivos y sin uno no hay nada que enseñar. Antes de ponerle
   un guardia, faltar uno dejaba la página en blanco sin una palabra. */
window.__labRoto = !BIO || !MOD || !EJ || !GRAF;
if(window.__labRoto){
  document.querySelector("main").innerHTML = `
    <section class="fig" style="margin-top:16px">
      <h2><i>ERROR</i> No se pudo cargar</h2>
      <p class="sub">Faltó alguno de los archivos de cálculo. Suele ser la conexión
        la primera vez que se abre.</p>
      <button class="btn" onclick="location.reload()">Reintentar</button>
    </section>`;
}

/* ---------- claves de almacenamiento ---------- */
const CLAVE_APP = "wellness.v1";        // la app de entrenamiento, si existe
const CLAVE_MIA = "palanca.v1";         // lo propio de este laboratorio

const esc = s => String(s==null?"":s).replace(/[&<>"]/g,
  c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const $ = id => document.getElementById(id);

function leerEstado(){
  try{ return JSON.parse(localStorage.getItem(CLAVE_APP) || "{}"); }catch(e){ return {}; }
}
function leerMio(){
  try{ return JSON.parse(localStorage.getItem(CLAVE_MIA) || "{}"); }catch(e){ return {}; }
}
function guardarMio(datos){
  try{ localStorage.setItem(CLAVE_MIA, JSON.stringify(Object.assign(leerMio(), datos))); }catch(e){}
}

/* La estatura se escribe aquí, pero si el deportista también usa la app de
   entrenamiento se le deja ahí puesta: es el mismo cuerpo y no tiene
   sentido pedírsela dos veces. */
function guardarAltura(altura){
  guardarMio({altura});
  try{
    const st = leerEstado();
    if(!st.v) return;
    st.perfilFisico = Object.assign({}, st.perfilFisico, {altura});
    st.metaMt = Date.now();                 // para que su nube se entere
    localStorage.setItem(CLAVE_APP, JSON.stringify(st));
  }catch(e){}
}
function alturaInicial(st){
  const mia = Number(leerMio().altura);
  if(mia) return {cm:mia, suya:true};
  const dela = Number((st.perfilFisico||{}).altura);
  if(dela) return {cm:dela, suya:true};
  return {cm:172, suya:false};
}

/* El peso: el que escriba aquí manda; si no, la última medición de la app,
   con la misma regla de 45 días que usa ella. */
const DIAS_PESO = 45;
function pesoDeLaApp(st){
  let mejor = null;
  for(const k in (st.logs||{})){
    const kg = Number(st.logs[k] && st.logs[k].cuerpo && st.logs[k].cuerpo.peso);
    if(kg > 0 && (!mejor || k > mejor.f)) mejor = {f:k, kg};
  }
  if(!mejor) return null;
  const dias = Math.round((Date.now() - new Date(mejor.f + "T12:00").getTime())/86400000);
  mejor.dias = isFinite(dias) ? dias : 0;
  mejor.viejo = mejor.dias > DIAS_PESO;
  return mejor;
}
/* El peso que de verdad usa en cada ejercicio, si lo tiene registrado. */
function cargaDeLaApp(st, nombre){
  let mejor = 0;
  for(const k in (st.logs||{})){
    for(const e of ((st.logs[k].workout||{}).ex || [])){
      if(e.name !== nombre) continue;
      for(const s of (e.sets||[])){
        if(s.p) continue;                    // planeada, no hecha
        const w = Number(s.w);
        if(w > mejor) mejor = w;
      }
    }
  }
  return mejor;
}

/* ---------- arranque ---------- */
const st0 = leerEstado();
const mio0 = leerMio();
const hayApp = !!st0.v;

/* Tema propio: si ya usa Coach Ale se arranca con el suyo, pero a partir
   de ahí este laboratorio recuerda el que elija aquí. */
/* Arranca oscuro: es una lámina técnica y en claro pierde la mitad
   de la gracia. Si ya eligió uno aquí, manda el suyo. */
let tema = mio0.tema || "dark";
function aplicarTema(){
  document.documentElement.setAttribute("data-theme", tema);
  const b = $("temaBtn"); if(b) b.textContent = tema === "dark" ? "🌙" : "☀️";
  const m = document.querySelector('meta[name="theme-color"]');
  if(m) m.setAttribute("content", tema === "dark" ? "#070b12" : "#e9eff7");
}
aplicarTema();

if(!window.__labRoto){
  const medidaPeso = pesoDeLaApp(st0);
  const ini = alturaInicial(st0);

  var ALTURA = ini.cm;
  var PESO   = Number(mio0.peso) || (medidaPeso ? medidaPeso.kg : 72);
  var CUERPO = BIO.cuerpoDe(ALTURA, PESO);
  var tuyos  = {altura: ini.suya, peso: !!(mio0.peso || medidaPeso)};

  var NOMBRE_GRUPO = {pecho:"Pecho", espalda:"Espalda", hombros:"Hombros", biceps:"Bíceps",
    triceps:"Tríceps", pierna:"Pierna", gluteo:"Glúteo", core:"Core"};
  var ORDEN = ["pecho","espalda","hombros","biceps","triceps","pierna","gluteo","core"];
  var filtro = "", grupoSel = "";
  var cargas = {};        // lo que escriba en cada ficha

  window.cargaDe = function(nombre){
    if(cargas[nombre] != null) return cargas[nombre];
    const m = MOD[nombre] || {};
    const real = cargaDeLaApp(st0, nombre);
    return real > 0 ? real : (m.carga || 0);
  };
  window.resultado = function(nombre, opciones){
    const m = MOD[nombre];
    if(!m || m.descrito) return null;
    try{ return BIO.calcular(m, CUERPO, cargaDe(nombre), opciones || {}); }
    catch(e){ return null; }
  };

  /* ---------- FIG. 01 · el cuerpo ---------- */
  window.pintarMedidas = function(){
    $("inAltura").value = ALTURA;
    $("inPeso").value = PESO;
    const L = CUERPO.L, cm = v => (v*100).toFixed(0);
    $("derivadas").innerHTML = `
      <span>Muslo <b>${cm(L.muslo)}</b> cm</span>
      <span>Pierna <b>${cm(L.pierna)}</b> cm</span>
      <span>Brazo al agarre <b>${cm(L.brazoEntero)}</b> cm</span>
      <span>Antebrazo <b>${cm(L.antebrazoMano)}</b> cm</span>
      <span>Tronco <b>${cm(L.tronco)}</b> cm</span>`;

    /* Si alguno de los dos datos no es suyo, los números de toda la página
       son los de otra persona. Decirlo, y no dejar que parezcan suyos. */
    const faltan = [];
    if(!tuyos.altura) faltan.push("la estatura");
    if(!tuyos.peso)   faltan.push("el peso");
    const av = $("avisoCuerpo");
    if(faltan.length){
      av.classList.remove("hidden");
      av.innerHTML = `<b>Estos no son tus números todavía.</b> Falta ${faltan.join(" y ")},
        así que está calculando con un cuerpo de ejemplo de ${ALTURA} cm y ${PESO} kg.
        Escríbelos aquí arriba y todo se recalcula solo.`;
    }else if(!mio0.peso && medidaPeso && medidaPeso.viejo){
      av.classList.remove("hidden");
      av.innerHTML = `El peso viene de tu medición del <b>${esc(medidaPeso.f)}</b>,
        hace ${medidaPeso.dias} días. Si cambiaste, cámbialo aquí: los ejercicios donde
        cargas tu propio cuerpo —flexiones, dominadas, gemelos— dependen de él.`;
    }else{
      av.classList.add("hidden");
    }
  };

  window.recalcular = function(){
    CUERPO = BIO.cuerpoDe(ALTURA, PESO);
    pintarMedidas(); pintarLista();
    if(window.fichaAbierta) abrirFicha(window.fichaAbierta);
  };

  /* ---------- FIG. 02 · la biblioteca ---------- */
  window.pintarGrupos = function(){
    $("grupos").innerHTML = ORDEN.map(g =>
      `<button class="chipg ${grupoSel===g?"on":""}" data-g="${g}">${NOMBRE_GRUPO[g]}</button>`).join("");
    document.querySelectorAll("#grupos .chipg").forEach(b => b.onclick = ()=>{
      grupoSel = grupoSel === b.dataset.g ? "" : b.dataset.g;
      pintarGrupos(); pintarLista();
    });
  };

  window.pintarLista = function(){
    const txt = filtro.trim().toLowerCase();
    const visibles = EJ.filter(x =>
      (!grupoSel || x.g === grupoSel) &&
      (!txt || x.n.toLowerCase().includes(txt) || x.eq.toLowerCase().includes(txt)));

    let html = "";
    for(const g of ORDEN){
      const dentro = visibles.filter(x => x.g === g);
      if(!dentro.length) continue;
      html += `<div class="gtit">${NOMBRE_GRUPO[g]}</div>`;
      html += dentro.map(x => {
        const m = MOD[x.n] || {};
        const r = resultado(x.n);
        return `<button class="fila" data-ej="${esc(x.n)}">
          <div class="nm"><b>${esc(x.n)}</b>
            <span>${esc(m.musc || NOMBRE_GRUPO[g])} · ${esc(x.eq)}</span></div>
          ${r ? GRAF.chispa(r, {ancho:48, alto:22}) : ""}
          ${r ? `<div class="tq">${Math.round(r.pico.torque)} <i>N·m</i></div>`
              : `<div class="tq no">explicado</div>`}
        </button>`;
      }).join("");
    }
    $("lista").innerHTML = html || `<p class="sub">Nada con ese nombre.</p>`;
    document.querySelectorAll("#lista .fila").forEach(b =>
      b.onclick = ()=> abrirFicha(b.dataset.ej));
  };

  /* ---------- FIG. 04 · el puente ---------- */
  $("puenteTxt").textContent = hayApp
    ? "Ya tienes Coach Ale en este teléfono: el laboratorio usa tu estatura, tu peso y el peso que levantas de verdad en cada ejercicio, y en la app ves el torque al elegir y al entrenar."
    : "Coach Ale es la app de entrenamiento: registra las series, arma el plan del mes y trae estos mismos números al momento de elegir el ejercicio. Si la usas, el laboratorio calcula con tus medidas y con el peso que levantas de verdad.";

  $("inAltura").oninput = e => {
    const v = parseFloat(e.target.value);
    if(v >= 130 && v <= 220){ ALTURA = v; tuyos.altura = true; guardarAltura(v); recalcular(); }
  };
  $("inPeso").oninput = e => {
    const v = parseFloat(e.target.value);
    if(v >= 30 && v <= 200){ PESO = v; tuyos.peso = true; guardarMio({peso:v}); recalcular(); }
  };
  $("buscar").oninput = e => { filtro = e.target.value; pintarLista(); };
  window.ponerCarga = (nombre, kg) => { cargas[nombre] = kg; };

  /* La segunda mitad se carga solo si hay con qué dibujarla. */
  const mas = document.createElement("script");
  mas.src = "ficha.js";
  document.body.appendChild(mas);
}

$("temaBtn").onclick = ()=>{
  tema = tema === "dark" ? "light" : "dark";
  guardarMio({tema}); aplicarTema();
};

/* El service worker: esta app funciona sin internet por su cuenta. */
if("serviceWorker" in navigator)
  addEventListener("load", ()=> navigator.serviceWorker.register("sw.js").catch(()=>{}));
