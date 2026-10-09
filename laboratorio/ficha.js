/* PALANCA · la ficha de cada ejercicio: la curva, el esquema y lo que el
   modelo tiene que admitir que no sabe. */

window.fichaAbierta = null;
let puntoSel = 0.5;        // dónde está el cursor dentro del recorrido, 0 a 1
let pieSel = 0;            // altura del pie en la prensa

const grafico = (r, i) => window.COACH_ALE_GRAFICO.curva(r, i);
const figura  = (r, i, m) => window.COACH_ALE_GRAFICO.figura(r, i, m);

function abrirFicha(nombre, opt){
  const x = EJ.find(e => e.n === nombre);
  const m = MOD[nombre];
  if(!x || !m) return;

  /* Cambiar de ejercicio es navegar; mover un control no. */
  const cambia = window.fichaAbierta !== nombre;
  if(cambia){
    window.fichaAbierta = nombre; puntoSel = 0.5; pieSel = 0;
    if(!(opt && opt.sinHistoria))
      history.pushState({ej:nombre}, "", "?ej=" + encodeURIComponent(nombre));
  }

  const r = m.descrito ? null : BIO.calcular(m, CUERPO, cargaDe(nombre), {pie:pieSel});
  const i = r ? Math.round(puntoSel*(r.puntos.length-1)) : 0;
  const p = r ? r.puntos[i] : null;
  const dibujo = window.COACH_ALE_EJERCICIOS.cuerpoSVG(x.g, "#0f62d6");
  const sola = r && p.torque2 == null && p.efectivo == null;

  const lecturas = r ? `
    <div class="lecturas${sola ? " sola" : ""}">
      <div class="lec a${p.flexor ? " flex" : ""}">
        <u></u><span>${esc(r.art||"Articulación")}</span>
        <b>${Math.round(p.torque)}</b><i>N·m</i>
        <em>${esc(r.musc||"")}${p.brazo!=null?` · brazo ${(Math.abs(p.brazo)*100).toFixed(0)} cm`:""}</em>
      </div>
      ${p.torque2 != null ? `
      <div class="lec b">
        <u></u><span>${esc(r.art2||"Segunda")}</span>
        <b>${Math.round(p.torque2)}</b><i>N·m</i>
        <em>${esc(r.musc2||"")}</em>
      </div>` : (p.efectivo != null ? `
      <div class="lec b">
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
      <label>${esc(r.ejeX||"Recorrido")} <b>${Math.round(p.ang)}°</b></label>
      <input type="range" id="inPunto" min="0" max="100" step="1" value="${Math.round(puntoSel*100)}">
      <div class="extremos"><span>inicio</span><span>final</span></div>
    </div>
    ${m.pieRegulable ? `
    <div class="ctrl">
      <label>Pie en la plataforma <b>${pieSel>0?"+":""}${pieSel} cm</b></label>
      <input type="range" id="inPie" min="-12" max="12" step="1" value="${pieSel}">
      <div class="extremos"><span>más abajo</span><span>más arriba</span></div>
    </div>` : ""}
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
      ${grafico(r, i)}
      ${leyenda}
      ${lecturas}
    </section>
    <section class="fig">
      <h2><i>FIG. 02</i> La posición y el brazo de palanca</h2>
      ${figura(r, i, m)}
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
      ${dibujo}
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

  const punto = $("inPunto");
  if(punto) punto.oninput = e => { puntoSel = e.target.value/100; abrirFicha(nombre, {sinHistoria:true}); };
  const pie = $("inPie");
  if(pie) pie.oninput = e => { pieSel = parseInt(e.target.value,10); abrirFicha(nombre, {sinHistoria:true}); };
  const cg = $("inCarga");
  if(cg) cg.oninput = e => {
    const v = parseFloat(e.target.value);
    ponerCarga(nombre, isFinite(v) && v >= 0 ? v : 0);
    abrirFicha(nombre, {sinHistoria:true});
  };
}

function mostrarLista(){
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
