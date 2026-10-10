/* PALANCA · la ficha de cada ejercicio: la curva, el esquema y lo que el
   modelo tiene que admitir que no sabe. */

window.fichaAbierta = null;
let puntoSel = 0.5;        // dónde está el cursor dentro del recorrido, 0 a 1
let ajustes = {};          // el montaje: apoyos, agarre, inclinación…
let artSel = null;         // qué articulación está seleccionada
let vista = "sagital";     // qué plano se está mirando
const ajuste = a => ajustes[a.id] != null ? ajustes[a.id] : a.def;
/* La curva siempre es la del plano sagital. Mirando de frente, los números
   de la figura no son los de la curva, y eso hay que avisarlo donde se ve. */
const vistaNota = () => vista === "frontal"
  ? " Esta curva es la de perfil, la de siempre; los números de frente están más abajo."
  : "";

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
/* Las del plano frontal salen de su propio motor: es otro problema, no
   otra vista del mismo. */
function metricasFrontales(r){
  const f = r.frontal;
  if(!f) return [];
  return [
    {clave:"caderaF", nombre:"Cadera · plano frontal", corto:"Cadera", musc:f.cadera.musc,
     torque:f.cadera.torque, brazo:f.cadera.brazo, gesto:f.cadera.gesto, apoyo:f.F},
    {clave:"rodillaF", nombre:"Rodilla · plano frontal", corto:"Rodilla", musc:f.rodilla.musc,
     torque:f.rodilla.torque, brazo:f.rodilla.brazo, gesto:f.rodilla.gesto, apoyo:f.F}
  ];
}

/* El pie de la lectura principal: el músculo y, si lo hay, el brazo de
   palanca del punto donde está el cursor. */
function pieDe(r, p){
  const a = r.musc ? esc(r.musc) : "";
  const b = p.brazo != null ? `brazo ${(Math.abs(p.brazo)*100).toFixed(0)} cm` : "";
  return a && b ? a + " · " + b : a + b;
}

/* Las métricas de una articulación, para cuando la tocas. */
function tarjetaArt(r, i, m){
  const todas = vista === "frontal" ? metricasFrontales(r) : BIO.metricasDe(r, i, m);
  if(!todas.length) return "";
  const sel = todas.find(x => x.clave === artSel) || todas[0];
  const chips = todas.map(x =>
    `<button class="artchip${x.clave === sel.clave ? " on" : ""}" data-art="${esc(x.clave)}">
       ${esc(x.corto || x.nombre || x.clave)}</button>`).join("");
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
        ${dato(sel.apoyo != null ? "Fuerza en el apoyo" : "Fuerza en el implemento",
          sel.apoyo != null ? Math.round(sel.apoyo) + " N"
                            : (r.fuerza ? Math.round(r.fuerza) + " N" : null))}
        ${dato("Carga en las manos", sel.porcentaje != null ? Math.round(sel.porcentaje) + "%" : null)}
        ${dato("Gesto que resiste", sel.gesto || null)}
      </div>
    </div>`;
}

function irA(u, desdeLaPeli){
  if(!vivo) return;
  puntoSel = Math.max(0, Math.min(1, u));
  const {r, m} = vivo;
  const i = Math.round(puntoSel*(r.puntos.length-1));

  if(vista === "frontal"){
    /* La vista de frente cambia de altura con la postura, así que se
       vuelve a dibujar; son cuatro líneas y no se nota. */
    const cont = document.querySelector("#vista-ficha .dibujo");
    if(cont && cont.parentNode){
      const tmp = document.createElement("div");
      tmp.innerHTML = G.frontal(r, i, m, CUERPO, {});
      if(tmp.firstElementChild){ cont.replaceWith(tmp.firstElementChild); conectarFigura(); }
    }
  }else{
    G.moverFigura(document.querySelector("#vista-ficha .dibujo"), r, i, m, vivo.enc);
  }
  G.moverCurva(document.querySelector("#vista-ficha .grafico"), r, i);

  pintarNumeros(r, i, m, desdeLaPeli);
}

/* Los números de la ficha en el punto i. Vive aparte de irA porque también
   hace falta cuando lo que cambia no es el recorrido sino el montaje. */
function pintarNumeros(r, i, m, desdeLaPeli){
  const p = r.puntos[i];
  const gb = document.getElementById("granB");
  if(gb) gb.textContent = Math.round(p.torque);
  const gem = document.getElementById("granEm");
  if(gem) gem.innerHTML = pieDe(r, p);
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
  if(et) et.textContent = Math.round(p.ang);
  const sl = document.getElementById("inPunto");
  if(sl && desdeLaPeli) sl.value = Math.round(puntoSel*100);
}

/* ---------- el montaje, en vivo ----------
   Antes, cada pizca de movimiento del deslizador volvía a construir la
   ficha entera. Eso hace dos cosas malas: reescribe treinta kilobytes de
   HTML por fotograma, y —peor— le quita de debajo al dedo el mismo
   control que estás arrastrando, así que en el teléfono el arrastre se
   corta a la primera. Ahora se recalcula el ejercicio y se cambian solo
   el dibujo, la curva y los números; los controles no se tocan. */
let pendiente = 0;
function pedirRefresco(nombre){
  if(pendiente) return;
  /* Agrupado por fotograma: arrastrando llegan muchos más eventos de
     input que cuadros de pantalla, y recalcular de más no se ve. */
  pendiente = requestAnimationFrame(()=>{ pendiente = 0; refrescarMontaje(nombre); });
}

function refrescarMontaje(nombre){
  const m = MOD[nombre], x = EJ.find(e => e.n === nombre);
  if(!m || m.descrito || !x || !vivo) return;
  const r = BIO.calcular(m, CUERPO, cargaDe(nombre), ajustes);
  const i = Math.round(puntoSel*(r.puntos.length-1));
  /* El encuadre se rehace: cambiar el montaje cambia por dónde pasa el
     cuerpo, y con la escala vieja el dibujo se saldría del marco. */
  vivo = {r, m, enc: G.encuadre(r, m, {eq:x.eq})};

  reemplazar("#vista-ficha .dibujo", vista === "frontal" && r.frontal
    ? G.frontal(r, i, m, CUERPO, {})
    : figura(r, i, m, x.eq, r.fuerza));
  reemplazar("#vista-ficha .grafico", G.curva(r, i));
  conectarFigura();
  pintarNumeros(r, i, m);
}

/* Cambia un <svg> por otro sin tocar nada de alrededor. */
function reemplazar(sel, html){
  const viejo = document.querySelector(sel);
  if(!viejo) return;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  if(tmp.firstElementChild) viejo.replaceWith(tmp.firstElementChild);
}

/* Las articulaciones del dibujo se vuelven a enganchar cada vez que el
   dibujo se rehace: los oyentes se van con el nodo viejo. */
function conectarFigura(){
  if(!vivo) return;
  const {r, m} = vivo;
  const i = Math.round(puntoSel*(r.puntos.length-1));
  const conDatos = new Set((vista === "frontal" ? metricasFrontales(r)
                                                : BIO.metricasDe(r, i, m)).map(z=>z.clave));
  document.querySelectorAll("#vista-ficha [data-toque]").forEach(o => {
    if(!conDatos.has(o.dataset.toque)){ o.style.cursor = "default"; return; }
    o.onclick = ()=> { artSel = o.dataset.toque; abrirFicha(window.fichaAbierta, {sinHistoria:true}); };
  });
  const halo = document.querySelector(`#vista-ficha [data-halo="${artSel}"]`);
  if(halo) halo.setAttribute("opacity", ".9");
}

function abrirFicha(nombre, opt){
  const x = EJ.find(e => e.n === nombre);
  const m = MOD[nombre];
  if(!x || !m) return;

  /* Cambiar de ejercicio es navegar; mover un control no. */
  const cambia = window.fichaAbierta !== nombre;
  if(cambia){
    window.fichaAbierta = nombre; puntoSel = 0.5; ajustes = {}; artSel = null; vista = "sagital";
    if(!(opt && opt.sinHistoria))
      history.pushState({ej:nombre}, "", "?ej=" + encodeURIComponent(nombre));
  }

  const r = m.descrito ? null : BIO.calcular(m, CUERPO, cargaDe(nombre), ajustes);
  const i = r ? Math.round(puntoSel*(r.puntos.length-1)) : 0;
  const p = r ? r.puntos[i] : null;
  const dibujo = window.COACH_ALE_EJERCICIOS.cuerpoSVG(x.g, "#0f62d6");
  const sola = r && p.torque2 == null && p.efectivo == null;   // sin segunda lectura

  /* Las dos lecturas juntas y cada una del color de su curva: así el
     gráfico no necesita una leyenda aparte y el mismo número no aparece
     tres veces en la misma pantalla. */
  const segunda = r && (p.torque2 != null
    ? {et:r.art2 || "Segunda", v:Math.round(p.torque2), u:"N·m", pie:r.musc2 || ""}
    : (p.efectivo != null
      ? {et:"Carga en las manos", v:Math.round(p.efectivo), u:"%",
         pie:"de tu peso, perpendicular al cuerpo"}
      : null));

  const duo = r ? `
    <div class="duo${segunda ? "" : " sola"}">
      <div class="grande a">
        <u></u><span>${esc(r.art || "Torque externo")}</span>
        <b id="granB">${Math.round(p.torque)}</b><i>N·m</i>
        <em id="granEm">${pieDe(r, p)}</em>
      </div>
      ${segunda ? `
      <div class="grande b" id="lecB">
        <u></u><span>${esc(segunda.et)}</span>
        <b>${segunda.v}</b><i>${esc(segunda.u)}</i>
        <em>${esc(segunda.pie)}</em>
      </div>` : ""}
    </div>` : "";

  /* El recorrido va pegado debajo del dibujo. Antes estaba al final de
     la sección y movías la barra con el dibujo fuera de la pantalla:
     el control principal no mostraba lo que controla. */
  const recorrido = r ? `
    <div class="recorrido">
      <button id="play" class="play" aria-label="Reproducir el movimiento">▶</button>
      <input type="range" id="inPunto" min="0" max="100" step="1"
             value="${Math.round(puntoSel*100)}" aria-label="${esc(r.ejeX||"Recorrido")}">
      <span class="punto"><b id="etPunto">${Math.round(p.ang)}</b>°</span>
    </div>
    <div class="extremos">
      <span>inicio</span><span>${esc(r.ejeX||"Recorrido")}</span><span>final</span>
    </div>` : "";

  /* El montaje en su propia lámina: son los mandos que recalculan el
     ejercicio entero, no los que te mueven por el recorrido. */
  const montaje = r ? `
    <section class="fig">
      <h2><i>FIG. 03</i> El montaje</h2>
      <p class="sub">Lo que puedes cambiar sin cambiar de ejercicio. Cada cosa que mueves
        aquí vuelve a calcular la curva entera.</p>
      <div class="campo">
        <label for="inCarga">Peso que usas</label>
        <div class="conUnidad">
          <input id="inCarga" type="number" inputmode="decimal" min="0" max="500" step="2.5"
                 value="${cargaDe(nombre)}"><i>kg</i>
        </div>
      </div>
      ${(r.ajustes||[]).map(a=>`
      <div class="ctrl ajuste">
        <label>${esc(a.et)} <b>${ajuste(a)}${a.u === "°" ? "" : " "}${esc(a.u)}</b></label>
        <input type="range" data-aj="${esc(a.id)}" min="${a.min}" max="${a.max}"
               step="${a.paso}" value="${ajuste(a)}">
        <p class="ayuda">${esc(a.ayuda)}</p>
      </div>`).join("")}
      ${m.nota ? `<div class="nota">${m.nota}</div>` : ""}
    </section>` : "";

  const nLam = r ? "04" : "02", nErr = r ? "05" : "03";

  $("vista-ficha").innerHTML = `
    <h1>${esc(x.n)}</h1>
    <p class="lead" style="margin-bottom:14px">${esc(NOMBRE_GRUPO[x.g])} · ${esc(x.eq)}</p>

    <div class="dosc">
    <div>
    ${r ? `<section class="fig">
      <h2><i>FIG. 01</i> Torque a lo largo del recorrido</h2>
      <p class="sub">El torque externo que tiene que aguantar cada articulación, por
        extremidad, de punta a punta del movimiento.${vistaNota()}</p>
      ${duo}
      ${grafico(r, i)}
    </section>
    <section class="fig">
      <h2><i>FIG. 02</i> La posición y el brazo de palanca</h2>
      ${r.frontal ? `
      <div class="seg">
        <button class="${vista==="sagital"?"on":""}" data-vista="sagital">De perfil</button>
        <button class="${vista==="frontal"?"on":""}" data-vista="frontal">De frente</button>
      </div>` : ""}
      ${vista === "frontal" && r.frontal
        ? G.frontal(r, i, m, CUERPO, {})
        : figura(r, i, m, x.eq, r.fuerza)}
      ${recorrido}
      ${tarjetaArt(r, i, m)}
      <p class="plano">${r.frontal
        ? (vista === "frontal"
            ? "De frente manda otra cosa: dónde cae el pie respecto a la cadera y hacia dónde apunta la rodilla. Son otros músculos y otro cálculo — no es la misma cuenta vista de lado."
            : "Los números de perfil son los del empuje. Cambia a <b>De frente</b> para ver lo que este plano no puede: el glúteo medio, los aductores y el valgo de rodilla.")
        : `Los números son del <b>plano ${esc(r.plano)}</b>, que es donde ocurre este movimiento. Lo que pase en el otro plano no entra.`}</p>
    </section>` : `
    <section class="fig">
      <h2><i>FIG. 01</i> Este no se calcula, se explica</h2>
      <div class="porque"><b>Por qué</b>${esc(m.porque)}</div>
      ${m.art ? `<div class="derivadas" style="margin-top:10px">
        <span>Articulación <b>${esc(m.art)}</b></span>
        <span>Músculo <b>${esc(m.musc)}</b></span></div>` : ""}
    </section>`}
    </div>

    <div>
    ${montaje}
    <section class="fig">
      <h2><i>FIG. ${nLam}</i> Dónde deberías sentirlo</h2>
      <div id="lamina" class="lamina" style="--int:1">${dibujo}</div>
      <p class="sub" style="margin:10px 0 0">${esc(x.s)}</p>
    </section>

    <section class="fig">
      <h2><i>FIG. ${nErr}</i> Errores más comunes</h2>
      <ul class="listas">${x.e.map(e=>`<li>${esc(e)}</li>`).join("")}</ul>
    </section>
    </div>
    </div>`;

  $("vista-lista").classList.add("hidden");
  $("vista-ficha").classList.remove("hidden");
  document.body.classList.add("ancho");
  $("atras").classList.remove("hidden");
  window.scrollTo(0,0);

  peli.pausa();
  vivo = r ? {r, m, enc: G.encuadre(r, m, {eq:x.eq})} : null;

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
  const conDatos = new Set(r ? (vista === "frontal" ? metricasFrontales(r) : BIO.metricasDe(r, i, m)).map(z=>z.clave) : []);
  document.querySelectorAll("#vista-ficha [data-vista]").forEach(b => b.onclick = ()=>{
    vista = b.dataset.vista; artSel = null;
    abrirFicha(nombre, {sinHistoria:true});
  });
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
    peli.pausa(); pintarPlay();
    const id = e.target.dataset.aj;
    ajustes[id] = parseFloat(e.target.value);
    /* La etiqueta se escribe en el acto: es el número que el dedo está
       moviendo y tiene que ir con él, no un fotograma después. */
    const a = (vivo && vivo.r.ajustes || []).find(z => z.id === id);
    const et = e.target.parentNode.querySelector("label b");
    if(et && a) et.textContent = ajustes[id] + (a.u === "°" ? "" : " ") + a.u;
    pedirRefresco(nombre);
  });
  const cg = $("inCarga");
  if(cg) cg.oninput = e => {
    const v = parseFloat(e.target.value);
    ponerCarga(nombre, isFinite(v) && v >= 0 ? v : 0);
    pedirRefresco(nombre);
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
  document.body.classList.remove("ancho");
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
