/* El gráfico de torque y el esquema de la posición.
   Vive aparte porque lo usan dos sitios: el laboratorio y la propia hoja
   del entrenamiento. Duplicarlo era garantizar que un día dejaran de
   parecerse. */

(function(global){
"use strict";

const esc = s => String(s==null?"":s).replace(/[&<>"]/g,
  c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------- la curva ---------- */
function curva(r, i, opt){
  const o = opt || {};
  const W = 320, H = o.alto || 156, IZQ = 36, DER = 10, ARR = 22, ABA = 26;
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

  const cursor = p ? `
    <line x1="${X(p.ang)}" y1="${ARR}" x2="${X(p.ang)}" y2="${H-ABA}"
      stroke="currentColor" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="3 3"/>
    <circle cx="${X(p.ang)}" cy="${Y(p.torque)}" r="4" fill="var(--q0)"/>
    ${hay2 ? `<circle cx="${X(p.ang)}" cy="${Y(p.torque2||0)}" r="4" fill="var(--c)"/>` : ""}` : "";

  return `<svg viewBox="0 0 ${W} ${H}" class="grafico" role="img"
      aria-label="Curva de torque a lo largo del recorrido, máximo ${Math.round(r.pico.torque)} newton metro">
    ${marcas}
    ${hay2 ? linea(q=>q.torque2||0, "var(--c)") : ""}
    ${linea(q=>q.torque, "var(--q0)")}
    ${cursor}
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

/* ---------- la curva en miniatura ----------
   Para una lista: sin ejes ni números, solo la forma. De un vistazo se ve
   si el ejercicio es duro abajo, arriba o parejo, que es lo que distingue
   a dos ejercicios del mismo músculo. */
function chispa(r, opt){
  const o = opt || {};
  const W = o.ancho || 62, H = o.alto || 24, M = 2.5;
  const xs = r.puntos.map(p=>p.ang);
  const a0 = Math.min(...xs), a1 = Math.max(...xs);
  const tope = Math.max(1, ...r.puntos.map(p=>p.torque));
  const X = a => M + (W-2*M)*(a-a0)/((a1-a0)||1);
  const Y = t => M + (H-2*M)*(1 - t/tope);
  const pts = r.puntos.map(p=>`${X(p.ang).toFixed(1)},${Y(p.torque).toFixed(1)}`).join(" ");
  return `<svg viewBox="0 0 ${W} ${H}" class="chispa" aria-hidden="true">
    <polyline points="${pts}" fill="none" stroke="var(--q0)" stroke-width="1.8"
      stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>
    <circle cx="${X(r.pico.ang).toFixed(1)}" cy="${Y(r.pico.torque).toFixed(1)}" r="2"
      fill="var(--q0)"/>
  </svg>`;
}

/* ---------- el esquema de la posición ---------- */
const UNE = {
  piernas: [["tobillo","rodilla"], ["rodilla","cadera"], ["cadera","hombro"]],
  apoyos:  [["pies","rodilla"], ["rodilla","cadera"], ["cadera","hombro"],
            ["hombro","codo"], ["codo","manos"]],
  brazos:  [["hombro","codo"], ["codo","mano"]],
  rotacion:[["pivote","extremo"]]
};

function figura(r, i, m, opt){
  const p = r.puntos[i], g = p && p.geo;
  if(!g) return "";
  const alto = (opt && opt.alto) || 250;

  let unir = UNE[m.patron] || [];
  let puntos = {}, carga = null, suelo = null;

  if(m.patron === "prensa"){
    puntos = {cadera:{x:0,y:0}, rodilla:g.K, pie:g.F};
    unir = [["cadera","rodilla"], ["rodilla","pie"]];
    carga = g.F;
  }else{
    for(const [a,b] of unir){ puntos[a] = g[a]; puntos[b] = g[b]; }
    if(m.patron === "piernas"){ carga = g.pCarga; suelo = g.tobillo.y - 0.04; }
    if(m.patron === "apoyos"){ suelo = Math.min(g.pies.y, g.manos.y); }
    if(m.patron === "brazos") carga = g.mano;
    if(m.patron === "rotacion") carga = g.extremo;
  }

  const vals = Object.values(puntos).filter(Boolean);
  if(!vals.length) return "";
  if(carga) vals.push(carga);
  const minX = Math.min(...vals.map(v=>v.x)), maxX = Math.max(...vals.map(v=>v.x));
  const minY = Math.min(...vals.map(v=>v.y)), maxY = Math.max(...vals.map(v=>v.y));
  const ancho = Math.max(0.5, maxX-minX), altoReal = Math.max(0.5, maxY-minY);
  const e = Math.min(240/ancho, (alto-40)/altoReal);
  const OX = 160 - (minX+maxX)/2*e, OY = alto/2 + (minY+maxY)/2*e;
  const X = v => (OX + v.x*e).toFixed(1), Y = v => (OY - v.y*e).toFixed(1);

  const segmentos = unir.filter(([a,b])=>puntos[a]&&puntos[b]).map(([a,b])=>
    `<line x1="${X(puntos[a])}" y1="${Y(puntos[a])}" x2="${X(puntos[b])}" y2="${Y(puntos[b])}"
       stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-opacity=".82"/>`).join("");
  const nudos = Object.values(puntos).filter(Boolean).map(v=>
    `<circle cx="${X(v)}" cy="${Y(v)}" r="5" fill="var(--card)"
       stroke="currentColor" stroke-width="2.5" stroke-opacity=".6"/>`).join("");

  /* La línea por donde tira la carga: es lo que hace el brazo de palanca. */
  const linea = carga ? `
    <line x1="${X(carga)}" y1="${(OY - carga.y*e - alto).toFixed(1)}"
          x2="${X(carga)}" y2="${(OY - carga.y*e + alto).toFixed(1)}"
          stroke="currentColor" stroke-opacity=".3" stroke-width="1.2" stroke-dasharray="5 4"/>
    <circle cx="${X(carga)}" cy="${Y(carga)}" r="7" fill="var(--q0)" fill-opacity=".85"/>` : "";

  /* El brazo que sostiene la carga: sin él la barra parecía flotar. */
  const sujeta = (m.patron === "piernas" && carga && puntos.hombro) ? `
    <line x1="${X(puntos.hombro)}" y1="${Y(puntos.hombro)}" x2="${X(carga)}" y2="${Y(carga)}"
          stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-opacity=".45"/>` : "";

  const piso = suelo != null ? `
    <line x1="10" y1="${(OY - suelo*e).toFixed(1)}" x2="310" y2="${(OY - suelo*e).toFixed(1)}"
          stroke="currentColor" stroke-opacity=".2" stroke-width="2"/>` : "";

  /* El brazo de palanca dibujado, que es de lo que va todo esto: la
     distancia perpendicular entre la articulación que trabaja y la línea
     por donde tira la carga. Sin verla, los números son solo números. */
  const clave = {piernas: (m.principal === "cadera" ? "cadera" : "rodilla"),
                 rotacion:"pivote", brazos:"hombro", apoyos:"codo", prensa:"rodilla"}[m.patron];
  const J = puntos[clave];
  let palanca = "";
  if(J && carga && p.brazo != null){
    /* La carga tira hacia abajo, así que la perpendicular es horizontal.
       En la prensa tira por el riel y el pie de la perpendicular se calcula. */
    const Q = m.patron === "prensa" && g.d
      ? (()=>{ const t = (J.x-carga.x)*g.d.x + (J.y-carga.y)*g.d.y;
               return {x: carga.x + t*g.d.x, y: carga.y + t*g.d.y}; })()
      : {x: carga.x, y: J.y};
    const mx = +X(J) + (+X(Q) - +X(J))*0.72,
          my = +Y(J) + (+Y(Q) - +Y(J))*0.72;
    palanca = `
      <line x1="${X(J)}" y1="${Y(J)}" x2="${X(Q)}" y2="${Y(Q)}"
            stroke="var(--c)" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="${mx.toFixed(1)}" y="${(my-6).toFixed(1)}" text-anchor="middle"
        font-size="10.5" font-weight="800" fill="var(--c)"
        stroke="var(--card)" stroke-width="3" paint-order="stroke"
        stroke-linejoin="round">${(Math.abs(p.brazo)*100).toFixed(0)} cm</text>
      <text x="${X(J)}" y="${Y(J)}" dx="11" dy="27" font-size="10"
        font-weight="700" fill="currentColor" opacity=".5"
        stroke="var(--card)" stroke-width="3" paint-order="stroke"
        stroke-linejoin="round">${esc(clave)} ${Math.round(p.ang)}°</text>`;
  }

  return `<svg viewBox="0 0 320 ${alto}" class="dibujo" role="img"
      aria-label="Esquema de la posición, la línea de la carga y el brazo de palanca">
    ${piso}${linea}${sujeta}${segmentos}${palanca}${nudos}
  </svg>`;
}

global.COACH_ALE_GRAFICO = {curva, chispa, figura};
})(window);
