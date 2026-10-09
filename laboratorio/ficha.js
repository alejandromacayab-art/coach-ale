/* PALANCA · la ficha de cada ejercicio: la curva, el esquema y lo que el
   modelo tiene que admitir que no sabe. */

window.fichaAbierta = null;
let puntoSel = 0.5;        // dónde está el cursor dentro del recorrido, 0 a 1
let ajustes = {};          // el montaje: apoyos, agarre, inclinación…
let artSel = null;         // qué articulación está seleccionada
const ajuste = a => ajustes[a.id] != null ? ajustes[a.id] : a.def;

/* Lo que hace falta para mover el esquema sin volver a dibujarlo: el
   cálculo, el encuadre fijo y el reproductor. */
let vivo = null;
const G = window.COACH_ALE_GRAFICO;
const peli = G.reproductor(u => { if(vivo) irA(u, true); });

const grafico = (r, i) => G.curva(r, i);
const figura  = (r, i, m, eq, N) => G.figura(r, i, m, {eq, newtons:N});

/* Mueve la ficha a un punto del recorrido tocando solo lo que cambia.
   Redibujarla entera en cada fotograma parpadeaba y perdía el foco del
   control; así el movimiento se ve continuo. */
/* Las métricas de una articulación, para cuando la tocas. */
function tarjetaArt(r, i, m){
  const todas = BIO.metricasDe(r, i, m);
  if(!todas.length) return "";
  const sel = todas.find(x => x.clave === artSel) || todas[0];
  const chips = todas.map(x =>
    `<button class="artchip${x.clave === sel.clave ? " on" : ""}" data-art="${esc(x.clave)}">
       ${esc(x.nombre || x.clave)}</button>`).join("");
  const dato = (et, v) => v == null ? "" :
    `<div><span>${et}</span><b>${v}</b></div>`;
  return `
    <div class="artbar">${chips}</div>
    <div class="artficha" id="artFicha">
      <h3>${esc(sel.nombre || sel.clave)}</h3>
      <p>${esc(sel.musc || "")}</p>
      <div class="artdatos">
        ${dato("Torque", sel.torque != null ? Math.round(sel.torque) + " N·m" : null)}
        ${dato("Ángulo", sel.angulo != null ? Math.round(sel.angulo) + "°" : null)}
        ${dato("Brazo de palanca", sel.brazo != null ? (Math.abs(sel.brazo)*100).toFixed(0) + " cm" : null)}
        ${dato("Fuerza en el implemento", r.fuerza ? Math.round(r.fuerza) + " N" : null)}
        ${dato("Carga en las manos", sel.porcentaje != null ? Math.round(sel.porcentaje) + "%" : null)}
      </div>
    </div>`;
}

function irA(u, desdeLaPeli){
  if(!vivo) return;
  puntoSel = Math.max(0, Math.min(1, u));
  const {r, m} = vivo;
  const i = Math.round(puntoSel*(r.puntos.length-1));
  const p = r.puntos[i];

  G.moverFigura(document.querySelector("#vista-ficha .dibujo"), r, i, m, vivo.enc);
  G.moverCurva(document.querySelector("#vista-ficha .grafico"), r, i);

  const gb = document.getElementById("granB");
  if(gb) gb.textContent = Math.round(p.torque);
  const gem = document.getElementById("granEm");
  if(gem && p.brazo != null)
    gem.textContent = `${r.art || ""}${r.musc ? " · " + r.musc : ""}` +
      ` · brazo ${(Math.abs(p.brazo)*100).toFixed(0)} cm`;
  const b = document.getElementById("lecB");
  if(b && p.torque2 != null) b.querySelector("b").textContent = Math.round(p.torque2);
  else if(b && p.efectivo != null) b.querySelector("b").textContent = Math.round(p.efectivo);

  /* La tarjeta de la articulación y el músculo encendido siguen al
     movimiento: eso es lo que lo hace un atlas vivo y no una lámina. */
  const tf = document.getElementById("artFicha");
  if(tf){
    const t2 = document.createElement("div");
    t2.innerHTML = tarjetaArt(r, i, m);
    const nueva = t2.querySelector("#artFicha");
    if(nueva) tf.innerHTML = nueva.innerHTML;
  }
  const lam = document.getElementById("lamina");
  if(lam) lam.style.setProperty("--int",
    (Math.min(1, p.torque / Math.max(1, r.pico.torque))).toFixed(3));

  const et = document.getElementById("etPunto");
  if(et) et.textContent = Math.round(p.ang) + "°";
  const sl = document.getElementById("inPunto");
  if(sl && desdeLaPeli) sl.value = Math.round(puntoSel*100);
}

function abrirFicha(nombre, opt){
  const x = EJ.find(e => e.n === nombre);
  const m = MOD[nombre];
  if(!x || !m) return;

  /* Cambiar de ejercicio es navegar; mover un control no. */
  const cambia = window.fichaAbierta !== nombre;
  if(cambia){
    window.fichaAbierta = nombre; puntoSel = 0.5; ajustes = {}; artSel = null;
    if(!(opt && opt.sinHistoria))
      history.pushState({ej:nombre}, "", "?ej=" + encodeURIComponent(nombre));
  }

  const r = m.descrito ? null : BIO.calcular(m, CUERPO, cargaDe(nombre), ajustes);
  const i = r ? Math.round(puntoSel*(r.puntos.length-1)) : 0;
  const p = r ? r.puntos[i] : null;
  const dibujo = window.COACH_ALE_EJERCICIOS.cuerpoSVG(x.g, "#0f62d6");
  const sola = r && p.torque2 == null && p.efectivo == null;   // sin segunda lectura

  const grande = r ? `
    <div class="grande">
      <span>Torque externo</span>
      <b id="granB">${Math.round(p.torque)}</b><i>N·m</i>
      <em id="granEm">${esc(r.art||"")}${r.musc ? " · " + esc(r.musc) : ""}${
        p.brazo != null ? ` · brazo ${(Math.abs(p.brazo)*100).toFixed(0)} cm` : ""}</em>
    </div>` : "";

  const lecturas = r ? `
    <div class="lecturas sola">
      ${p.torque2 != null ? `
      <div class="lec b" id="lecB">
        <u></u><span>${esc(r.art2||"Segunda")}</span>
        <b>${Math.round(p.torque2)}</b><i>N·m</i>
        <em>${esc(r.musc2||"")}</em>
      </div>` : (p.efectivo != null ? `
      <div class="lec b" id="lecB">
        <u></u><span>Carga en las manos</span>
        <b>${Math.round(p.efectivo)}</b><i>%</i>
        <em>de tu peso, perpendicular al cuerpo</em>
      </div>` : "")}
    </div>` : "";

  const leyenda = r && r.puntos.some(q=>q.torque2!=null) ? `
    <div class="leyenda">
      <i><u style="background:var(--q0)"></u>${esc(r.art)}</i>
      <i><u style="background:var(--c)"></u>${esc(r.art2)}</i>
    </div>` : "";

  const control = r ? `
    <div class="ctrl">
      <label>${esc(r.ejeX||"Recorrido")} <b id="etPunto">${Math.round(p.ang)}°</b></label>
      <div class="reproduce">
        <button id="play" class="play" aria-label="Reproducir el movimiento">▶</button>
        <input type="range" id="inPunto" min="0" max="100" step="1" value="${Math.round(puntoSel*100)}">
      </div>
      <div class="extremos"><span>inicio</span><span>final</span></div>
    </div>
    ${(r.ajustes||[]).map(a=>`
    <div class="ctrl ajuste">
      <label>${esc(a.et)} <b>${ajuste(a)}${a.u === "°" ? "" : " "}${esc(a.u)}</b></label>
      <input type="range" data-aj="${esc(a.id)}" min="${a.min}" max="${a.max}"
             step="${a.paso}" value="${ajuste(a)}">
      <p class="ayuda">${esc(a.ayuda)}</p>
    </div>`).join("")}
    <div class="medidas" style="margin-top:14px">
      <div>
        <label for="inCarga">Peso que usas (kg)</label>
        <input id="inCarga" type="number" inputmode="numeric" min="0" max="500" step="2.5"
               value="${cargaDe(nombre)}">
      </div>
    </div>` : "";

  $("vista-ficha").innerHTML = `
    <h1>${esc(x.n)}</h1>
    <p class="lead" style="margin-bottom:14px">${esc(NOMBRE_GRUPO[x.g])} · ${esc(x.eq)}</p>

    ${r ? `<section class="fig">
      <h2><i>FIG. 01</i> Torque a lo largo del recorrido</h2>
      <p class="sub">Por extremidad. Mueve el control para recorrer el ejercicio.</p>
      ${grande}
      ${grafico(r, i)}
      ${leyenda}
      ${lecturas}
    </section>
    <section class="fig">
      <h2><i>FIG. 02</i> La posición y el brazo de palanca</h2>
      ${figura(r, i, m, x.eq, r.fuerza)}
      ${tarjetaArt(r, i, m)}
      <p class="plano">Los números son del <b>plano ${esc(r.plano)}</b>, que es
        donde ocurre este movimiento. Lo que pase en el otro plano no entra.</p>
      ${control}
      ${m.nota ? `<div class="nota">${m.nota}</div>` : ""}
    </section>` : `
    <section class="fig">
      <h2><i>FIG. 01</i> Este no se calcula, se explica</h2>
      <div class="porque"><b>Por qué</b>${esc(m.porque)}</div>
      ${m.art ? `<div class="derivadas" style="margin-top:10px">
        <span>Articulación <b>${esc(m.art)}</b></span>
        <span>Músculo <b>${esc(m.musc)}</b></span></div>` : ""}
    </section>`}

    <section class="fig">
      <h2><i>FIG. ${r ? "03" : "02"}</i> Dónde deberías sentirlo</h2>
      <div id="lamina" class="lamina" style="--int:1">${dibujo}</div>
      <p class="sub" style="margin:10px 0 0">${esc(x.s)}</p>
    </section>

    <section class="fig">
      <h2><i>FIG. ${r ? "04" : "03"}</i> Errores más comunes</h2>
      <ul class="listas">${x.e.map(e=>`<li>${esc(e)}</li>`).join("")}</ul>
    </section>`;

  $("vista-lista").classList.add("hidden");
  $("vista-ficha").classList.remove("hidden");
  $("atras").classList.remove("hidden");
  window.scrollTo(0,0);

  peli.pausa();
  vivo = r ? {r, m, enc: G.encuadre(r, m, {})} : null;

  const punto = $("inPunto");
  if(punto) punto.oninput = e => { peli.pausa(); pintarPlay(); irA(e.target.value/100); };
  const bPlay = $("play");
  if(bPlay) bPlay.onclick = ()=>{
    if(peli.activo) peli.pausa(); else peli.play();
    pintarPlay();
  };
  /* Cambiar el montaje recalcula el ejercicio entero: no es moverse por
     el recorrido, es otro ejercicio. */
  /* Solo se pueden tocar las articulaciones de las que hay algo que
     decir: tocar una sin métricas y que no pase nada es peor que no
     poder tocarla. */
  const conDatos = new Set(r ? BIO.metricasDe(r, i, m).map(z=>z.clave) : []);
  const elegir = c => { if(!conDatos.has(c)) return; artSel = c; abrirFicha(nombre, {sinHistoria:true}); };
  document.querySelectorAll("#vista-ficha [data-art]").forEach(b =>
    b.onclick = ()=> elegir(b.dataset.art));
  document.querySelectorAll("#vista-ficha [data-toque]").forEach(o => {
    if(!conDatos.has(o.dataset.toque)){ o.style.cursor = "default"; return; }
    o.onclick = ()=> elegir(o.dataset.toque);
  });
  /* El halo marca la que estás mirando. */
  const halo = document.querySelector(`#vista-ficha [data-halo="${artSel}"]`);
  if(halo) halo.setAttribute("opacity", ".9");

  document.querySelectorAll("#vista-ficha [data-aj]").forEach(sl => sl.oninput = e => {
    peli.pausa();
    ajustes[e.target.dataset.aj] = parseFloat(e.target.value);
    abrirFicha(nombre, {sinHistoria:true});
  });
  const cg = $("inCarga");
  if(cg) cg.oninput = e => {
    const v = parseFloat(e.target.value);
    ponerCarga(nombre, isFinite(v) && v >= 0 ? v : 0);
    abrirFicha(nombre, {sinHistoria:true});
  };
}

function pintarPlay(){
  const b = $("play");
  if(b){ b.textContent = peli.activo ? "❚❚" : "▶";
         b.classList.toggle("on", peli.activo); }
}

function mostrarLista(){
  peli.pausa(); vivo = null;
  window.fichaAbierta = null;
  $("vista-ficha").classList.add("hidden");
  $("vista-lista").classList.remove("hidden");
  $("atras").classList.add("hidden");
  pintarLista();
  window.scrollTo(0,0);
}

/* Atrás deshace el paso del historial, así el botón de la página y el del
   teléfono hacen lo mismo. */
$("atras").onclick = ()=> { if(window.fichaAbierta) history.back(); };
window.onpopstate = e => {
  const n = e.state && e.state.ej;
  if(n) abrirFicha(n, {sinHistoria:true}); else mostrarLista();
};

pintarMedidas();
pintarGrupos();
pintarLista();

/* Enlace directo a un ejercicio: es lo que usa la app de entrenamiento. */
const pedido = new URLSearchParams(location.search).get("ej");
if(pedido && EJ.some(x => x.n === pedido)){
  history.replaceState({ej:pedido}, "", location.search);
  abrirFicha(pedido, {sinHistoria:true});
}
