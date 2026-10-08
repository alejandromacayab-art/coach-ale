/* La ficha de cada ejercicio: la curva de torque, la figura y lo que el
   modelo tiene que admitir que no sabe. */

let fichaAbierta = null;
let puntoSel = 0.5;        // dónde está el cursor dentro del recorrido, de 0 a 1
let pieSel = 0;            // altura del pie en la prensa

/* ---------- el gráfico ---------- */
function grafico(r, i){
  const W = 320, H = 156, IZQ = 36, DER = 10, ARR = 22, ABA = 26;
  const xs = r.puntos.map(p=>p.ang);
  const a0 = Math.min(...xs), a1 = Math.max(...xs);
  const hay2 = r.puntos.some(p => p.torque2 != null);
  const tope = Math.max(1, ...r.puntos.map(p => Math.max(p.torque, p.torque2||0)));
  const X = a => IZQ + (W-IZQ-DER)*(a-a0)/((a1-a0)||1);
  const Y = t => ARR + (H-ARR-ABA)*(1 - t/tope);

  const linea = (sel, color) => `<polyline fill="none" stroke="${color}" stroke-width="2.4"
    stroke-linejoin="round" stroke-linecap="round"
    points="${r.puntos.map(p=>`${X(p.ang).toFixed(1)},${Y(sel(p)).toFixed(1)}`).join(" ")}"/>`;

  const p = r.puntos[i];
  const marcas = [0, tope/2, tope].map(t =>
    `<text x="${IZQ-6}" y="${Y(t)+3.5}" text-anchor="end" font-size="9"
       fill="currentColor" opacity=".45">${Math.round(t)}</text>
     <line x1="${IZQ}" y1="${Y(t)}" x2="${W-DER}" y2="${Y(t)}"
       stroke="currentColor" stroke-opacity=".10" stroke-width="1"/>`).join("");

  return `<svg viewBox="0 0 ${W} ${H}" class="grafico" role="img"
      aria-label="Curva de torque a lo largo del recorrido">
    ${marcas}
    ${hay2 ? linea(p=>p.torque2||0, "var(--c)") : ""}
    ${linea(p=>p.torque, "var(--q0)")}
    <line x1="${X(p.ang)}" y1="${ARR}" x2="${X(p.ang)}" y2="${H-ABA}"
      stroke="currentColor" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="3 3"/>
    <circle cx="${X(p.ang)}" cy="${Y(p.torque)}" r="4" fill="var(--q0)"/>
    ${hay2 ? `<circle cx="${X(p.ang)}" cy="${Y(p.torque2||0)}" r="4" fill="var(--c)"/>` : ""}
    <circle cx="${X(r.pico.ang)}" cy="${Y(r.pico.torque)}" r="3" fill="none"
      stroke="var(--q0)" stroke-width="1.6" opacity=".55"/>
    <text x="${Math.min(W-DER-18, Math.max(IZQ+18, X(r.pico.ang)))}"
      y="${Math.max(10, Y(r.pico.torque)-8)}" text-anchor="middle" font-size="9"
      font-weight="800" fill="var(--q0)" opacity=".8">máximo</text>
    <text x="${IZQ}" y="${H-8}" font-size="9.5" fill="currentColor"
      opacity=".45">${Math.round(a0)}°</text>
    <text x="${W-DER}" y="${H-8}" text-anchor="end" font-size="9.5" fill="currentColor"
      opacity=".45">${Math.round(a1)}°</text>
    <text x="${(IZQ+W-DER)/2}" y="${H-8}" text-anchor="middle" font-size="9.5"
      font-weight="700" fill="currentColor" opacity=".45">${esc(r.ejeX||"")}</text>
  </svg>`;
}

/* ---------- la figura ---------- */
const UNE = {
  piernas: [["tobillo","rodilla"], ["rodilla","cadera"], ["cadera","hombro"]],
  apoyos:  [["pies","rodilla"], ["rodilla","cadera"], ["cadera","hombro"],
            ["hombro","codo"], ["codo","manos"]],
  brazos:  [["hombro","codo"], ["codo","mano"]],
  rotacion:[["pivote","extremo"]]
};

function figura(r, i, m){
  const p = r.puntos[i], g = p.geo;
  if(!g) return "";

  let unir = UNE[m.patron] || [];
  let puntos = {}, carga = null, suelo = null;

  if(m.patron === "prensa"){
    const {F, K, d} = g;
    puntos = {cadera:{x:0,y:0}, rodilla:K, pie:F};
    unir = [["cadera","rodilla"], ["rodilla","pie"]];
    carga = F;
  }else{
    for(const [a,b] of unir){ puntos[a] = g[a]; puntos[b] = g[b]; }
    if(m.patron === "piernas"){ carga = g.pCarga; suelo = g.tobillo.y - 0.04; }
    if(m.patron === "apoyos"){ carga = null; suelo = Math.min(g.pies.y, g.manos.y); }
    if(m.patron === "brazos") carga = g.mano;
    if(m.patron === "rotacion") carga = g.extremo;
  }

  const vals = Object.values(puntos).filter(Boolean);
  if(!vals.length) return "";
  if(carga) vals.push(carga);
  const minX = Math.min(...vals.map(v=>v.x)), maxX = Math.max(...vals.map(v=>v.x));
  const minY = Math.min(...vals.map(v=>v.y)), maxY = Math.max(...vals.map(v=>v.y));
  const ancho = Math.max(0.5, maxX-minX), alto = Math.max(0.5, maxY-minY);
  const esc0 = Math.min(240/ancho, 210/alto);
  const OX = 160 - (minX+maxX)/2*esc0, OY = 125 + (minY+maxY)/2*esc0;
  const X = v => (OX + v.x*esc0).toFixed(1), Y = v => (OY - v.y*esc0).toFixed(1);

  const segmentos = unir.filter(([a,b])=>puntos[a]&&puntos[b]).map(([a,b])=>
    `<line x1="${X(puntos[a])}" y1="${Y(puntos[a])}" x2="${X(puntos[b])}" y2="${Y(puntos[b])}"
       stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-opacity=".82"/>`).join("");
  const nudos = Object.values(puntos).filter(Boolean).map(v=>
    `<circle cx="${X(v)}" cy="${Y(v)}" r="5" fill="var(--card)"
       stroke="currentColor" stroke-width="2.5" stroke-opacity=".6"/>`).join("");

  /* La línea por donde tira la carga, que es lo que hace el brazo de palanca. */
  const linea = carga ? `
    <line x1="${X(carga)}" y1="${(OY - carga.y*esc0 - 120).toFixed(1)}"
          x2="${X(carga)}" y2="${(OY - carga.y*esc0 + 120).toFixed(1)}"
          stroke="currentColor" stroke-opacity=".3" stroke-width="1.2" stroke-dasharray="5 4"/>
    <circle cx="${X(carga)}" cy="${Y(carga)}" r="7" fill="var(--q0)" fill-opacity=".85"/>` : "";

  /* El brazo que sostiene la carga: sin él la barra parecía flotar. */
  const sujeta = (m.patron === "piernas" && carga && puntos.hombro) ? `
    <line x1="${X(puntos.hombro)}" y1="${Y(puntos.hombro)}" x2="${X(carga)}" y2="${Y(carga)}"
          stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-opacity=".45"/>` : "";

  const piso = suelo != null ? `
    <line x1="10" y1="${(OY - suelo*esc0).toFixed(1)}" x2="310" y2="${(OY - suelo*esc0).toFixed(1)}"
          stroke="currentColor" stroke-opacity=".2" stroke-width="2"/>` : "";

  return `<svg viewBox="0 0 320 250" class="dibujo" role="img"
      aria-label="Esquema de la posición y la línea de la carga">
    ${piso}${linea}${sujeta}${segmentos}${nudos}
  </svg>`;
}

/* ---------- la ficha ---------- */
function abrirFicha(nombre){
  const x = EJ.find(e => e.n === nombre);
  const m = MOD[nombre];
  if(!x || !m) return;
  if(fichaAbierta !== nombre){ fichaAbierta = nombre; puntoSel = 0.5; pieSel = 0; }

  const r = m.descrito ? null : BIO.calcular(m, CUERPO, cargaDe(nombre), {pie:pieSel});
  const i = r ? Math.round(puntoSel*(r.puntos.length-1)) : 0;
  const p = r ? r.puntos[i] : null;
  const dibujo = window.COACH_ALE_EJERCICIOS.cuerpoSVG(x.g, "#22e07a");

  const sola = r && p.torque2 == null && p.efectivo == null;
  const lecturas = r ? `
    <div class="lecturas${sola ? " sola" : ""}">
      <div class="lec a">
        <span>${esc(r.art||"Articulación")}</span>
        <b>${Math.round(p.torque)}</b><i>N·m</i>
        <em>${esc(r.musc||"")}${p.brazo!=null?` · brazo ${(p.brazo*100).toFixed(0)} cm`:""}</em>
      </div>
      ${p.torque2 != null ? `
      <div class="lec b">
        <span>${esc(r.art2||"Segunda")}</span>
        <b>${Math.round(p.torque2)}</b><i>N·m</i>
        <em>${esc(r.musc2||"")}</em>
      </div>` : (p.efectivo != null ? `
      <div class="lec b">
        <span>Carga en las manos</span>
        <b>${Math.round(p.efectivo)}</b><i>%</i>
        <em>de tu peso corporal, perpendicular al cuerpo</em>
      </div>` : "")}
    </div>` : "";

  const leyenda = r && r.puntos.some(q=>q.torque2!=null) ? `
    <div class="leyenda">
      <i><u style="background:var(--q0)"></u>${esc(r.art)}</i>
      <i><u style="background:var(--c)"></u>${esc(r.art2)}</i>
    </div>` : "";

  const control = r ? `
    <div class="ctrl">
      <label>${esc(r.ejeX||"Recorrido")}: <b>${Math.round(p.ang)}°</b></label>
      <input type="range" id="inPunto" min="0" max="100" step="1" value="${Math.round(puntoSel*100)}">
      <div class="extremos"><span>inicio</span><span>final</span></div>
    </div>
    ${m.pieRegulable ? `
    <div class="ctrl">
      <label>Pie en la plataforma: <b>${pieSel>0?"+":""}${pieSel} cm</b></label>
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
    <div class="cab">
      <h1>${esc(x.n)}</h1>
    </div>
    <p class="lead" style="margin-bottom:14px">${esc(NOMBRE_GRUPO[x.g])} · ${esc(x.eq)}</p>

    ${r ? `<section class="lab">
      <h2>El torque a lo largo del recorrido</h2>
      <p class="sub">Por extremidad. Mueve el control para recorrer el ejercicio.</p>
      ${grafico(r, i)}
      ${leyenda}
      ${lecturas}
      ${figura(r, i, m)}
      ${control}
      ${m.nota ? `<div class="nota">${m.nota}</div>` : ""}
    </section>` : `
    <section class="lab">
      <h2>Este no se calcula, se explica</h2>
      <div class="porque"><b>Por qué</b>${esc(m.porque)}</div>
      ${m.art ? `<div class="derivadas" style="margin-top:10px">
        <span>Articulación <b>${esc(m.art)}</b></span>
        <span>Músculo <b>${esc(m.musc)}</b></span></div>` : ""}
    </section>`}

    <section class="lab">
      <h2>Dónde deberías sentirlo</h2>
      <div class="fidibujo" style="color:var(--accent)">${dibujo}</div>
      <p style="font-size:13.5px;color:var(--tx2);margin:10px 0 0">${esc(x.s)}</p>
    </section>

    <section class="lab">
      <h2>Errores más comunes</h2>
      <ul class="limites">${x.e.map(e=>`<li>${esc(e)}</li>`).join("")}</ul>
    </section>`;

  $("vista-lista").classList.add("hidden");
  $("vista-ficha").classList.remove("hidden");
  window.scrollTo(0,0);

  const punto = $("inPunto");
  if(punto) punto.oninput = e => { puntoSel = e.target.value/100; abrirFicha(nombre); };
  const pie = $("inPie");
  if(pie) pie.oninput = e => { pieSel = parseInt(e.target.value,10); abrirFicha(nombre); };
  const cg = $("inCarga");
  if(cg) cg.oninput = e => {
    const v = parseFloat(e.target.value);
    cargas[nombre] = isFinite(v) && v >= 0 ? v : 0;
    abrirFicha(nombre);
  };
}

function volver(){
  if(fichaAbierta){
    fichaAbierta = null;
    $("vista-ficha").classList.add("hidden");
    $("vista-lista").classList.remove("hidden");
    pintarLista();
    window.scrollTo(0,0);
  }else{
    location.href = "index.html";
  }
}
$("atras").onclick = volver;

pintarMedidas();
pintarGrupos();
pintarLista();
