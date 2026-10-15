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

  const pts = sel => r.puntos.map(p=>`${X(p.ang).toFixed(1)},${Y(sel(p)).toFixed(1)}`).join(" ");
  const linea = (sel, color) => `<polyline fill="none" stroke="${color}" stroke-width="2.4"
    stroke-linejoin="round" stroke-linecap="round" points="${pts(sel)}"/>`;
  /* El área bajo la curva: deja ver de un golpe dónde se acumula el
     trabajo, que es lo que una línea sola no cuenta. */
  const area = (sel, color) => `<polygon fill="${color}" fill-opacity=".13"
    points="${X(a0).toFixed(1)},${(H-ABA).toFixed(1)} ${pts(sel)} ${X(a1).toFixed(1)},${(H-ABA).toFixed(1)}"/>`;

  const p = r.puntos[i];
  const marcas = [0, tope/2, tope].map(t =>
    `<text x="${IZQ-6}" y="${Y(t)+3.5}" text-anchor="end" font-size="9"
       fill="currentColor" opacity=".45">${Math.round(t)}</text>
     <line x1="${IZQ}" y1="${Y(t)}" x2="${W-DER}" y2="${Y(t)}"
       stroke="currentColor" stroke-opacity=".10" stroke-width="1"/>`).join("");

  const cursor = p ? `
    <line data-cur x1="${X(p.ang)}" y1="${ARR-6}" x2="${X(p.ang)}" y2="${H-ABA}"
      stroke="var(--marca)" stroke-opacity=".85" stroke-width="1.4" stroke-dasharray="4 4"/>
    <circle data-cura cx="${X(p.ang)}" cy="${Y(p.torque)}" r="4.5" fill="var(--marca)"/>
    ${hay2 ? `<circle data-curb cx="${X(p.ang)}" cy="${Y(p.torque2||0)}" r="4" fill="var(--c)"/>` : ""}` : "";

  return `<svg viewBox="0 0 ${W} ${H}" class="grafico" role="img"
      aria-label="Curva de torque a lo largo del recorrido, máximo ${Math.round(r.pico.torque)} newton metro">
    ${marcas}
    ${area(q=>q.torque, "var(--q0)")}
    ${hay2 ? linea(q=>q.torque2||0, "var(--c)") : ""}
    ${linea(q=>q.torque, "var(--q0)")}
    ${cursor}
    <circle cx="${X(r.pico.ang)}" cy="${Y(r.pico.torque)}" r="3" fill="none"
      stroke="var(--q0)" stroke-width="1.6" opacity=".6"/>
    ${(()=>{ const alFinal = X(r.pico.ang) > (IZQ + W-DER)/2;
      return `<text x="${alFinal ? W-DER : Math.max(IZQ+2, X(r.pico.ang))}"
        y="${Math.max(11, Y(r.pico.torque)-9)}" font-size="10"
        text-anchor="${alFinal ? "end" : "start"}"
        font-weight="800" fill="var(--q0)" opacity=".85">pico ${Math.round(r.pico.torque)}</text>`; })()}
    ${/* En todos los modelos el recorrido arranca con el músculo largo:
          decirlo con palabras vale más que dos cifras en grados. */""}
    <text x="${IZQ-2}" y="${H-7}" font-size="9.5" font-weight="700"
      fill="currentColor" opacity=".45">Estirado</text>
    <text x="${W-DER}" y="${H-7}" text-anchor="end" font-size="9.5" font-weight="700"
      fill="currentColor" opacity=".45">Acortado</text>
    <line x1="${(IZQ+62)}" y1="${H-11}" x2="${(W-DER-66)}" y2="${H-11}"
      stroke="currentColor" stroke-opacity=".22" stroke-width="1"/>
    <path d="M${(W-DER-66)} ${H-14} L${(W-DER-62)} ${H-11} L${(W-DER-66)} ${H-8}"
      fill="none" stroke="currentColor" stroke-opacity=".22" stroke-width="1"/>
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

/* ---------- el esquema de la posición ----------
   Se parte en tres para poder animarlo: el encuadre se calcula una vez
   con TODOS los fotogramas del recorrido, la geometría se calcula por
   fotograma, y el dibujo se crea una vez y después solo se le mueven los
   atributos. Antes la escala salía del fotograma que tocara, así que al
   recorrer el ejercicio el cuerpo entero se encogía y se estiraba: parecía
   que la cámara hacía zoom en vez de que el deportista se moviera.      */

const UNE = {
  piernas: [["tobillo","rodilla"], ["rodilla","cadera"], ["cadera","hombro"]],
  apoyos:  [["pies","rodilla"], ["rodilla","cadera"], ["cadera","hombro"],
            ["hombro","codo"], ["codo","manos"]],
  brazos:  [["hombro","codo"], ["codo","mano"]],
  rotacion:[["pivote","extremo"]],
  prensa:  [["cadera","rodilla"], ["rodilla","pie"]]
};
const ARTICULACION = {piernas:"rodilla", rotacion:"pivote", brazos:"hombro",
                      apoyos:"codo", prensa:"rodilla"};

/* ---------- la escena de los ejercicios de brazo ----------
   El motor de brazos solo conoce hombro, codo y mano: un press de banca
   salía como dos palos flotando al lado de un disco y no había forma de
   saber qué ejercicio era. El torso, la cabeza y el mueble no se calculan
   —no entran en ninguna cuenta— pero son lo que hace que se reconozca.
   Van en gris de mobiliario, aparte del cuerpo que sí se mide.        */
const ESCENA = {
  tumbado:   {tronco:{x:1, y:0},  banco:"plano"},
  depie:     {tronco:{x:0, y:-1}},
  sentado:   {tronco:{x:0, y:-1}, banco:"asiento"},
  paralelas: {tronco:{x:0, y:-1}, barras:true}
};

function escenaDe(c, enc, m, cuerpo){
  let e = m.escena && ESCENA[m.escena];
  const L = cuerpo && cuerpo.L;
  if(!e || !L || !c.puntos.hombro) return "";
  const n = v => v.toFixed(1);
  const H = c.puntos.hombro, T = L.tronco;
  /* El banco inclinado o declinado gira el torso y el banco con él: un
     press inclinado dibujado sobre un banco plano es otro ejercicio. */
  const a = (m.escenaAng || 0)*Math.PI/180;
  const ca = Math.cos(a), sa = Math.sin(a);
  const u = {x: e.tronco.x*ca - e.tronco.y*sa, y: e.tronco.x*sa + e.tronco.y*ca};
  e = Object.assign({}, e, {tronco:u});
  const fin = {x: H.x + u.x*T, y: H.y + u.y*T};
  const h = px(enc, H), f = px(enc, fin);
  const rr = 0.098*enc.e;
  /* La cabeza, al otro lado del hombro que el torso. Se calcula en metros
     y se pasa a píxeles después: mezclarlos dejaba la cabeza pegada al
     hombro en vez de encima. */
  const cab = px(enc, {x: H.x - e.tronco.x*0.17, y: H.y - e.tronco.y*0.17});
  const gris = 'stroke="currentColor" stroke-opacity=".34"';

  /* El mueble: un banco debajo del torso, o un asiento con respaldo. */
  let mueble = "";
  if(e.banco === "plano"){
    /* Paralelo al torso y un poco por debajo: es la superficie en la que
       la espalda se apoya, no una mesa que pasa por ahí. */
    const nx = -u.y*0.12*T, ny = u.x*0.12*T;
    const p1 = px(enc, {x:H.x - u.x*0.26*T + nx, y:H.y - u.y*0.26*T + ny});
    const p2 = px(enc, {x:H.x + u.x*1.10*T + nx, y:H.y + u.y*1.10*T + ny});
    mueble = `<line data-mueble x1="${n(p1.x)}" y1="${n(p1.y)}" x2="${n(p2.x)}" y2="${n(p2.y)}"
      ${gris} stroke-width="${n(Math.max(7, 0.09*T*enc.e))}" stroke-linecap="round"/>`;
  }else if(e.banco === "asiento"){
    const a = px(enc, {x:H.x - 0.30*T, y:H.y - T});
    const b = px(enc, {x:H.x + 0.55*T, y:H.y - T});
    const c2 = px(enc, {x:H.x - 0.26*T, y:H.y + 0.12*T});
    mueble = `<line data-mueble x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}"
        ${gris} stroke-width="${n(Math.max(7, 0.09*T*enc.e))}" stroke-linecap="round"/>
      <line data-mueble2 x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(c2.x)}" y2="${n(c2.y)}"
        ${gris} stroke-width="${n(Math.max(6, 0.075*T*enc.e))}" stroke-linecap="round"/>`;
  }else if(e.barras && c.puntos.mano){
    const q = px(enc, c.puntos.mano), d = 0.13*T*enc.e;
    mueble = `<line data-mueble x1="${n(q.x-d)}" y1="${n(q.y)}" x2="${n(q.x+d)}" y2="${n(q.y)}"
      ${gris} stroke-width="5" stroke-linecap="round"/>`;
  }

  /* El torso y la cabeza, en el mismo gris: no son cuerpo medido. */
  return `${mueble}
    <line data-tronco x1="${n(h.x)}" y1="${n(h.y)}" x2="${n(f.x)}" y2="${n(f.y)}"
      ${gris} stroke-width="${n(Math.max(8, 0.17*T*enc.e))}" stroke-linecap="round"/>
    <circle data-cabezaEsc cx="${n(cab.x)}" cy="${n(cab.y)}" r="${n(rr*0.92)}"
      fill="none" ${gris} stroke-width="2.4"/>`;
}

/* ---------- el pie y los apoyos ----------
   Una pierna que termina en el tobillo no se entiende: no se sabe hacia
   dónde mira la persona ni dónde está el suelo. Con el pie puesto, la
   figura se ancla y el ejercicio se reconoce de un vistazo. Todo sale
   del modelo —el largo del pie es antropometría y la altura de los
   apoyos la decide el propio ejercicio—, no hay nada inventado.      */
function piezaPie(c, enc, m, cuerpo){
  const L = cuerpo && cuerpo.L;
  if(!L || c.suelo == null) return null;
  const n = v => v.toFixed(1);
  const linea = (pts, w) =>
    `<polyline points="${pts.map(q=>`${n(q.x)},${n(q.y)}`).join(" ")}"
       fill="none" stroke="var(--cuerpo)" stroke-opacity=".92" stroke-width="${n(w)}"
       stroke-linecap="round" stroke-linejoin="round"/>`;
  const halo = (pts, w) =>
    `<polyline points="${pts.map(q=>`${n(q.x)},${n(q.y)}`).join(" ")}"
       fill="none" stroke="var(--card)" stroke-width="${n(w+3.4)}"
       stroke-linecap="round" stroke-linejoin="round"/>`;
  const w = Math.max(3, GROSOR.pie*enc.e);

  if(m.patron === "piernas" && c.puntos.tobillo){
    /* El tobillo del modelo cae casi sobre el talón, y el medio del pie
       —el punto sobre el que se busca el equilibrio— a 0,45 del largo por
       delante. El dibujo respeta eso: talón justo detrás, punta al final. */
    const t = c.puntos.tobillo;
    const pts = [t, {x:t.x - 0.08*L.pie, y:c.suelo}, {x:t.x + 0.92*L.pie, y:c.suelo}]
      .map(q => px(enc, q));
    return {pts, w};
  }
  if(m.patron === "apoyos" && c.puntos.pies && c.puntos.cadera){
    /* La punta apunta al lado contrario de la cadera: en una flexión los
       dedos quedan por detrás del cuerpo, que es como se apoya. */
    const f = c.puntos.pies, h = c.puntos.cadera;
    const s = f.x >= h.x ? 1 : -1;
    const pts = [f, {x:f.x + s*0.55*L.pie, y:f.y - 0.22*L.pie}].map(q => px(enc, q));
    return {pts, w: w*0.9};
  }
  return null;
}

/* Los bloques bajo las manos o los pies cuando el ejercicio los sube: es
   lo que separa una flexión normal de una inclinada o una declinada, y
   la altura la dice el modelo, no el dibujo. */
function apoyosDe(c, enc, m){
  if(m.patron !== "apoyos" || c.suelo == null) return [];
  const colgado = c.puntos.hombro && c.puntos.manos &&
                  c.puntos.hombro.y < c.puntos.manos.y;
  const out = [];
  for(const k of ["manos", "pies"]){
    const v = c.puntos[k];
    if(!v || v.y - c.suelo < 0.05) continue;
    if(k === "manos" && colgado){ out.push({barra:true, v:px(enc, v)}); continue; }
    const a = px(enc, {x:v.x, y:v.y}), b = px(enc, {x:v.x, y:c.suelo});
    out.push({x:a.x, y:a.y, alto:b.y - a.y, ancho:Math.max(16, 0.16*enc.e)});
  }
  return out;
}

/* ---------- los músculos sobre el hueso ----------
   Cada músculo va dibujado encima del hueso que mueve, del lado que le
   toca, y se enciende con el torque de su articulación. Así no hay que
   mirar la lámina y el esquema por separado: el músculo anda con el
   hueso.                                                               */
const MUSCULO_EN = {
  rodilla: ["rodilla","cadera"],      // cuádriceps, en el muslo
  cadera:  ["cadera","rodilla"],      // glúteo e isquios, el mismo muslo por detrás
  tobillo: ["tobillo","rodilla"],     // gemelo, en la pierna
  codo:    ["codo","hombro"],         // tríceps o bíceps, en el brazo
  hombro:  ["hombro","codo"],         // el del hombro, el mismo brazo por el otro lado
  pivote:  ["pivote","extremo"]
};

const uni = v => { const L = Math.hypot(v.x, v.y) || 1; return {x:v.x/L, y:v.y/L}; };

/* De qué lado del hueso está. Cuando en la articulación se juntan dos
   huesos, por fuera del ángulo: ahí va el que extiende —el cuádriceps
   delante del muslo, el glúteo detrás de la cadera, el tríceps detrás
   del brazo—. Cuando hay un hueso solo no hay ángulo que mirar, así que
   manda la carga: el músculo está del lado hacia el que tiene que tirar,
   que es por donde no está el peso. */
function ladoMusculo(c, clave, A, B){
  const J = c.puntos[clave];
  const u = uni({x:B.x-A.x, y:B.y-A.y});
  const n = {x:-u.y, y:u.x};
  const vecinos = [];
  for(const [a,b] of c.unir){
    if(a === clave && c.puntos[b]) vecinos.push(c.puntos[b]);
    if(b === clave && c.puntos[a]) vecinos.push(c.puntos[a]);
  }
  if(J && vecinos.length >= 2){
    const d1 = uni({x:vecinos[0].x-J.x, y:vecinos[0].y-J.y});
    const d2 = uni({x:vecinos[1].x-J.x, y:vecinos[1].y-J.y});
    const dentro = {x:d1.x+d2.x, y:d1.y+d2.y};
    return (dentro.x*n.x + dentro.y*n.y) > 0 ? -1 : 1;
  }
  if(J && c.carga) return (c.carga.x - J.x) >= 0 ? 1 : -1;
  return 1;
}

/* La banda del músculo, en píxeles: corrida hacia su lado y un poco más
   corta que el hueso, para que se vea el hueso debajo en las puntas. */
/* usados: por hueso, hacia dónde salió la banda anterior. Dos músculos
   que comparten hueso —el cuádriceps y el glúteo en el fémur— tienen que
   quedar en caras opuestas. En la prensa los dos caían encima del mismo
   lado, superpuestos, porque la cadera no tiene segundo hueso que mirar
   y se resolvía por la carga. */
function bandaMusculo(c, enc, clave, usados){
  const par = MUSCULO_EN[clave];
  if(!par) return null;
  const A = c.puntos[par[0]], B = c.puntos[par[1]];
  if(!A || !B) return null;
  const a = px(enc, A), b = px(enc, B);
  const dx = b.x-a.x, dy = b.y-a.y, L = Math.hypot(dx,dy) || 1;
  if(L < 12) return null;
  const ux = dx/L, uy = dy/L;
  /* El lado se calcula en metros, con la y hacia arriba; en pantalla la
     y va al revés, así que la normal se voltea con él. */
  let s = ladoMusculo(c, clave, A, B);
  let nx = uy*s, ny = -ux*s;
  const hueso = par.slice().sort().join("-");
  if(usados){
    const antes = usados.get(hueso);
    if(antes && antes.x*nx + antes.y*ny > 0.5){ s = -s; nx = -nx; ny = -ny; }
    usados.set(hueso, {x:nx, y:ny});
  }
  const g = +grosor(par[0], par[1], enc);
  /* Encima del hueso y no al lado: separada del todo parecían dos palos
     paralelos en vez de un músculo pegado a su hueso. La banda cubre la
     mitad de fuera y asoma un poco por el borde, que es como se ve un
     músculo sobre el hueso que mueve. */
  const w = Math.max(2.6, g*0.62);
  const sep = g*0.30;
  const d0 = L*0.16, d1 = L*0.84;
  return {w,
    x1: a.x + ux*d0 + nx*sep, y1: a.y + uy*d0 + ny*sep,
    x2: a.x + ux*d1 + nx*sep, y2: a.y + uy*d1 + ny*sep};
}

/* Los puntos del cuerpo en un fotograma, en metros. */
function cuadro(r, i, m){
  const p = r.puntos[i], g = p && p.geo;
  if(!g) return null;
  const unir = UNE[m.patron] || [];
  const puntos = {};
  let carga = null, suelo = null;

  if(m.patron === "prensa"){
    puntos.cadera = {x:0, y:0}; puntos.rodilla = g.K; puntos.pie = g.F;
    carga = g.F;
  }else{
    for(const [a,b] of unir){ puntos[a] = g[a]; puntos[b] = g[b]; }
    if(m.patron === "piernas"){ carga = g.pCarga; suelo = g.tobillo.y - 0.04; }
    if(m.patron === "apoyos")   suelo = Math.min(g.pies.y, g.manos.y);
    if(m.patron === "brazos")   carga = g.mano;
    if(m.patron === "rotacion") carga = g.extremo;
  }
  if(!Object.keys(puntos).length) return null;

  /* El brazo de palanca: la perpendicular entre la articulación que
     trabaja y la línea por donde tira la carga. */
  const clave = m.principal === "cadera" && m.patron === "piernas"
    ? "cadera" : ARTICULACION[m.patron];
  const J = puntos[clave];
  let palanca = null;
  if(J && carga && p.brazo != null){
    const Q = m.patron === "prensa" && g.d
      ? (()=>{ const t = (J.x-carga.x)*g.d.x + (J.y-carga.y)*g.d.y;
               return {x: carga.x + t*g.d.x, y: carga.y + t*g.d.y}; })()
      : {x: carga.x, y: J.y};
    palanca = {J, Q, clave, cm: Math.abs(p.brazo)*100, ang: p.ang};
  }
  return {unir, puntos, carga, suelo, palanca,
          sujeta: m.patron === "piernas" && carga && puntos.hombro ? [puntos.hombro, carga] : null};
}

/* El encuadre, de una vez y para todo el recorrido: así el cuerpo se
   mueve dentro de un marco quieto. */
function encuadre(r, m, opt){
  const alto = (opt && opt.alto) || 250;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, hay = false;
  for(let i = 0; i < r.puntos.length; i++){
    const c = cuadro(r, i, m);
    if(!c) continue;
    hay = true;
    const vs = Object.values(c.puntos).filter(Boolean).concat(c.carga ? [c.carga] : []);
    /* El torso y el mueble también ocupan: sin contarlos el asiento salía
       cortado por el borde de abajo. */
    const esc = m.escena && ESCENA[m.escena];
    if(esc && c.puntos.hombro && r.cuerpo){
      const H = c.puntos.hombro, T = r.cuerpo.L.tronco;
      const a = (m.escenaAng || 0)*Math.PI/180, ca = Math.cos(a), sa = Math.sin(a);
      const u = {x: esc.tronco.x*ca - esc.tronco.y*sa,
                 y: esc.tronco.x*sa + esc.tronco.y*ca};
      vs.push({x:H.x + u.x*T*1.2 - u.y*0.2*T, y:H.y + u.y*T*1.2 + u.x*0.2*T});
      vs.push({x:H.x - u.x*0.35*T,            y:H.y - u.y*0.35*T});
      if(esc.banco === "asiento") vs.push({x:H.x - 0.4*T, y:H.y - T*1.15});
    }
    for(const v of vs){
      if(v.x < x0) x0 = v.x; if(v.x > x1) x1 = v.x;
      if(v.y < y0) y0 = v.y; if(v.y > y1) y1 = v.y;
    }
    if(c.suelo != null && c.suelo < y0) y0 = c.suelo;
  }
  if(!hay) return null;
  /* Margen: el cuerpo no es una línea, es una silueta con grosor, y la
     cabeza y el implemento sobresalen de las articulaciones. Sin esto se
     salía del marco por los cuatro lados. El disco de una barra mide 45
     centímetros de diámetro, así que el aire tiene que dar para su radio
     o el plato sale cortado por el borde. */
  const RADIO = {"Barra":0.29, "Mancuernas":0.22, "Máquina":0.17, "Polea":0.14};
  const aire = Math.max(0.20, RADIO[(opt && opt.eq) || ""] || 0);
  x0 -= aire; x1 += aire; y0 -= aire; y1 += aire;
  const ancho = Math.max(0.5, x1-x0), altoReal = Math.max(0.5, y1-y0);
  const e = Math.min(300/ancho, (alto-20)/altoReal);
  return {e, alto,
          OX: 160 - (x0+x1)/2*e,
          OY: alto/2 + (y0+y1)/2*e};
}

const px = (enc, v) => ({x: enc.OX + v.x*enc.e, y: enc.OY - v.y*enc.e});

/* Grosor de cada segmento, en metros de verdad. */
/* Los anchos de cada segmento, en metros. Eran casi el doble: un muslo
   salía con una proporción de 2 a 1 contra su largo, cuando uno de verdad
   anda en 5 a 1. El bulto tapaba justo lo que hay que mirar —la línea de
   la carga y el brazo de palanca—, así que la silueta se adelgazó hasta
   la proporción real y el dibujo quedó de trazo, no de mancha. */
const GROSOR = {cadera:0.115, rodilla:0.075, tobillo:0.052, hombro:0.090,
                codo:0.048, manos:0.038, mano:0.038, pie:0.052, pies:0.052,
                pivote:0.055, extremo:0.042};
function grosor(a, b, enc){
  const g = ((GROSOR[a] || 0.062) + (GROSOR[b] || 0.062))/2;
  return Math.max(3, g*enc.e).toFixed(1);
}


/* ---------- el implemento ----------
   El punto donde actúa la carga deja de ser un punto: se dibuja con lo
   que de verdad tienes en la mano. Visto de perfil una barra es un disco
   —el eje apunta hacia dentro de la pantalla— y por eso no lleva una
   línea horizontal cruzándola: eso sería la barra vista de frente.

   Las medidas van en metros y se escalan con el cuerpo, así que un disco
   de veinte kilos se ve del porte que es al lado de un fémur.          */
function implemento(eq, patron, enc, geo){
  const d = m => (m*enc.e).toFixed(1);                 // metros a píxeles
  const col = 'fill="var(--q0)" fill-opacity=".85"';
  /* De contorno y casi sin relleno: el hierro tiene que leerse como hierro
     sin tapar la silueta ni competir con el brazo de palanca. */
  const col2 = 'fill="var(--q0)" fill-opacity=".15" stroke="var(--q0)" stroke-width="2.2"';
  const linea = w => `stroke="var(--q0)" stroke-width="${w}" fill="none"`;

  if(patron === "prensa" && geo && geo.d){
    /* La prensa tiene plataforma y carro: sin ellos el esquema es una
       pierna doblada en el aire. Van en coordenadas del riel, así que
       siguen la inclinación de la máquina. */
    const D = geo.d, P = geo.p;
    const pt = (a, b) => `${((D.x*a + P.x*b)*enc.e).toFixed(1)},${(-(D.y*a + P.y*b)*enc.e).toFixed(1)}`;
    return {svg: `
      <polyline points="${pt(0.05, 0.16)} ${pt(0.05, -0.16)}"
            stroke="currentColor" stroke-opacity=".2" stroke-width="15"
            stroke-linecap="round" fill="none"/>
      <polyline points="${pt(0, 0.18)} ${pt(0, -0.18)}"
            stroke="var(--q0)" stroke-opacity=".8" stroke-width="7"
            stroke-linecap="round" fill="none"/>`};
  }

  /* De perfil una barra es un disco: el eje apunta hacia dentro de la
     pantalla. Por eso no lleva una línea cruzándola — eso sería la barra
     vista de frente. Lo que cambia entre una barra y una mancuerna es el
     tamaño del disco, y a escala del cuerpo se nota.

     Un disco sólido de color, sin embargo, era una mancha: se sabía que
     había algo en la mano pero no qué. Ahora van dibujados con sus piezas
     —el plato, el reborde, el buje, el collarín— y de contorno, que es lo
     que los hace reconocibles sin pesar en el dibujo. */
  if(eq === "Barra")
    return {svg:`
      <circle cx="${d(0.055)}" r="${d(0.225)}" ${col2} opacity=".4"/>
      <circle r="${d(0.225)}" ${col2}/>
      <circle r="${d(0.172)}" fill="none" ${linea(1.3)} stroke-opacity=".5"/>
      <rect x="${d(-0.035)}" y="${d(-0.065)}" width="${d(0.07)}" height="${d(0.13)}"
            rx="${d(0.02)}" fill="var(--card)" ${linea(2)}/>
      <circle r="${d(0.028)}" fill="var(--q0)" fill-opacity=".55"/>`};
  if(eq === "Mancuernas")
    /* De perfil se ve la campana de cerca; la de atrás asoma apenas y es
       lo que la distingue de un disco de barra. */
    return {svg:`
      <circle cx="${d(0.085)}" r="${d(0.098)}" ${col2} opacity=".4"/>
      <line x1="0" y1="0" x2="${d(0.085)}" y2="0" ${linea(3)} stroke-opacity=".45"/>
      <circle r="${d(0.112)}" ${col2}/>
      <circle r="${d(0.072)}" fill="none" ${linea(1.3)} stroke-opacity=".5"/>
      <circle r="${d(0.03)}" fill="var(--card)" ${linea(1.8)}/>`};
  if(eq === "Máquina")
    /* El rodillo acolchado de la máquina, con su eje. */
    return {svg:`
      <rect x="${d(-0.115)}" y="${d(-0.06)}" width="${d(0.23)}" height="${d(0.12)}"
            rx="${d(0.055)}" ${col2}/>
      <line x1="${d(-0.055)}" y1="${d(-0.035)}" x2="${d(-0.055)}" y2="${d(0.035)}"
            ${linea(1.3)} stroke-opacity=".45"/>
      <line x1="${d(0.055)}" y1="${d(-0.035)}" x2="${d(0.055)}" y2="${d(0.035)}"
            ${linea(1.3)} stroke-opacity=".45"/>
      <circle r="${d(0.022)}" fill="var(--q0)" fill-opacity=".55"/>`};
  if(eq === "Polea")
    /* El agarre de la polea: el asa y el mosquetón del que sale el cable. */
    return {svg:`
      <rect x="${d(-0.085)}" y="${d(-0.022)}" width="${d(0.17)}" height="${d(0.044)}"
            rx="${d(0.022)}" ${col2}/>
      <circle cy="${d(-0.062)}" r="${d(0.032)}" fill="none" ${linea(2)}/>`,
      tirante:"cable"};
  if(eq === "Banda elástica")
    return {svg:`
      <rect x="${d(-0.07)}" y="${d(-0.02)}" width="${d(0.14)}" height="${d(0.04)}"
            rx="${d(0.02)}" ${col2}/>`, tirante:"banda"};
  return null;                                          // peso corporal: no hay implemento
}

/* El cable o la goma, desde el implemento hasta su anclaje. El modelo
   supone que tira en vertical, y dibujarlo así deja esa suposición a la
   vista en vez de escondida en una nota. */
function tirante(tipo, x, y, alto){
  const fin = alto - 14;
  if(tipo === "banda"){
    /* En zigzag, que es lo que la distingue de un cable: la goma estira. */
    let dd = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    const n = 7, paso = (fin - y)/n;
    for(let k = 1; k <= n; k++)
      dd += ` L ${(x + (k % 2 ? 7 : -7)).toFixed(1)} ${(y + paso*k).toFixed(1)}`;
    return `<path data-tirante d="${dd}" fill="none" stroke="var(--q0)"
              stroke-opacity=".55" stroke-width="2.4" stroke-linejoin="round"/>`;
  }
  return `<line data-tirante x1="${x.toFixed(1)}" y1="${y.toFixed(1)}"
            x2="${x.toFixed(1)}" y2="${fin.toFixed(1)}"
            stroke="var(--q0)" stroke-opacity=".5" stroke-width="2.4"/>
          <rect data-ancla x="${(x-13).toFixed(1)}" y="${(fin-3).toFixed(1)}" width="26" height="11"
            rx="2.5" fill="var(--q0)" fill-opacity=".35"/>`;
}

/* La pastilla se corre al centro de la línea y se aparta un poco hacia
   el lado libre. */
function etiquetaPalanca(A, B, cm){
  const dx = B.x-A.x, dy = B.y-A.y, L = Math.hypot(dx,dy) || 1;
  const nx = -dy/L, ny = dx/L;                 // perpendicular a la línea
  const sep = 15;
  return {x: (A.x+B.x)/2 + nx*sep, y: (A.y+B.y)/2 + ny*sep,
          w: Math.max(34, String(Math.round(cm)).length*8 + 26)};
}
/* El rótulo de los newton vive encima de la carga y la pastilla de los
   centímetros en mitad del brazo de palanca: en el peso muerto, donde el
   brazo sale casi horizontal desde la cadera hasta la barra, los dos caen
   en el mismo sitio y uno tapa al otro. Si se pisan, los newton suben. */
function altoFuerza(q, enc, t){
  const y = Math.max(16, q.y - 0.30*enc.e);
  if(t && Math.abs(t.x - q.x) < 46 && Math.abs(t.y - y) < 21)
    return Math.max(13, Math.min(y, t.y - 25));
  return y;
}
/* El cuadradito del ángulo recto, en el extremo que toca la línea de fuerza. */
function escuadra(A, B){
  const dx = A.x-B.x, dy = A.y-B.y, L = Math.hypot(dx,dy) || 1;
  const ux = dx/L, uy = dy/L, vx = -uy, vy = ux, k = 7;
  const p1 = [B.x + ux*k, B.y + uy*k];
  const p2 = [p1[0] + vx*k, p1[1] + vy*k];
  const p3 = [B.x + vx*k, B.y + vy*k];
  const f = v => v.map(q=>q.toFixed(1)).join(" ");
  return `M ${f(p1)} L ${f(p2)} L ${f(p3)}`;
}

function figuraSVG(r, i, m, opt){
  const enc = encuadre(r, m, opt);
  const c = enc && cuadro(r, i, m);
  if(!c) return "";
  const P = v => px(enc, v);
  const n = (v, d) => v.toFixed(d == null ? 1 : d);

  const unir = c.unir.filter(([a,b]) => c.puntos[a] && c.puntos[b]);
  const nombres = Object.keys(c.puntos).filter(k => c.puntos[k]);

  const piso = c.suelo != null
    ? `<line data-piso x1="8" y1="${n(P({x:0,y:c.suelo}).y)}" x2="312" y2="${n(P({x:0,y:c.suelo}).y)}"
         stroke="currentColor" stroke-opacity=".2" stroke-width="2"/>` : "";

  /* La carga: su línea de acción, el tirante si lo hay, y el implemento.
     El implemento va en un grupo que solo se traslada, así que animarlo
     es mover un transform y no volver a dibujarlo. */
  const imp = c.carga ? implemento((opt && opt.eq) || "", m.patron, enc, r.puntos[i].geo) : null;
  const tPal = c.palanca
    ? etiquetaPalanca(P(c.palanca.J), P(c.palanca.Q), c.palanca.cm) : null;
  const carga = c.carga ? (()=>{
    const q = P(c.carga);
    return `
    <line data-lcarga x1="${n(q.x)}" y1="0" x2="${n(q.x)}" y2="${enc.alto}"
          stroke="currentColor" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="6 5"/>
    ${imp && imp.tirante ? tirante(imp.tirante, q.x, q.y, enc.alto) : ""}
    ${imp ? `<g data-imp transform="translate(${n(q.x)},${n(q.y)})">${imp.svg}</g>`
          : `<circle data-carga cx="${n(q.x)}" cy="${n(q.y)}" r="7"
               fill="var(--q0)" fill-opacity=".85"/>`}`;
  })() : "";

  /* Los bloques de apoyo van al fondo: son mobiliario, no cuerpo. */
  const apoyos = apoyosDe(c, enc, m).map((a, k) => a.barra
    ? `<circle data-apoyo="${k}" cx="${n(a.v.x)}" cy="${n(a.v.y)}" r="7"
         fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="3"/>`
    : `<rect data-apoyo="${k}" x="${n(a.x - a.ancho/2)}" y="${n(a.y)}"
         width="${n(a.ancho)}" height="${n(Math.max(2, a.alto))}" rx="3"
         fill="currentColor" fill-opacity=".12" stroke="currentColor"
         stroke-opacity=".3" stroke-width="1.5"/>`).join("");

  const pie = (()=>{
    const q = piezaPie(c, enc, m, r.cuerpo);
    if(!q) return "";
    const pts = q.pts.map(v=>`${n(v.x)},${n(v.y)}`).join(" ");
    return `<polyline data-piehalo points="${pts}" fill="none" stroke="var(--card)"
        stroke-width="${n(q.w + 3.4)}" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline data-pie points="${pts}" fill="none" stroke="var(--cuerpo)"
        stroke-opacity=".92" stroke-width="${n(q.w)}" stroke-linecap="round"
        stroke-linejoin="round"/>`;
  })();

  const escena = escenaDe(c, enc, m, r.cuerpo);

  const sujeta = c.sujeta ? `
    <line data-sujeta x1="${n(P(c.sujeta[0]).x)}" y1="${n(P(c.sujeta[0]).y)}"
          x2="${n(P(c.sujeta[1]).x)}" y2="${n(P(c.sujeta[1]).y)}"
          stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-opacity=".45"/>` : "";

  /* Cada segmento con su ancho real, y debajo un trazo del color del
     fondo un poco más gordo. Ese halo es lo que separa un brazo que pasa
     por delante del torso: adelgazada la silueta, sin él los cruces se
     convertían en una sola mancha. */
  const segmentos = unir.map(([a,b], k) => {
    const A = P(c.puntos[a]), B = P(c.puntos[b]), g = +grosor(a, b, enc);
    const xy = `x1="${n(A.x)}" y1="${n(A.y)}" x2="${n(B.x)}" y2="${n(B.y)}"`;
    return `<line data-seg="${k}" ${xy} stroke="var(--card)"
         stroke-width="${(g + 3.4).toFixed(1)}" stroke-linecap="round"/>
       <line data-seg="${k}" ${xy} stroke="var(--cuerpo)" stroke-opacity=".92"
         stroke-width="${g.toFixed(1)}" stroke-linecap="round"/>`;
  }).join("");

  /* Los músculos que este ejercicio mueve, encima de su hueso. La página
     los enciende después con una variable por articulación. */
  const usados = new Map();
  const musculos = ((opt && opt.musculos) || []).map(mu => {
    const b = bandaMusculo(c, enc, mu.clave, usados);
    if(!b) return "";
    return `<line data-musculo="${esc(mu.clave)}" x1="${n(b.x1)}" y1="${n(b.y1)}"
       x2="${n(b.x2)}" y2="${n(b.y2)}" stroke="${mu.color || "var(--q0)"}"
       stroke-width="${n(b.w)}" stroke-linecap="round"/>`;
  }).join("");

  /* La cabeza, donde haya tronco: sin ella la silueta no se sabe de qué
     lado mira. */
  const cab = c.puntos.hombro && (c.puntos.cadera || c.puntos.pies) ? (()=>{
    const h = P(c.puntos.hombro), o = P(c.puntos.cadera || c.puntos.pies);
    const dx = h.x-o.x, dy = h.y-o.y, L = Math.hypot(dx,dy) || 1;
    /* La cabeza, de contorno: rellena era el pegote más grande del dibujo. */
    const rr = 0.098*enc.e;
    return `<circle data-cabeza cx="${n(h.x + dx/L*rr*1.5)}" cy="${n(h.y + dy/L*rr*1.5)}"
              r="${n(rr)}" fill="var(--card)" stroke="var(--cuerpo)"
              stroke-opacity=".92" stroke-width="2.6"/>`;
  })() : "";

  /* Cada articulación con su nombre y un área de toque generosa: en un
     teléfono un círculo de cuatro píxeles no se acierta nunca. */
  const nudos = nombres.map((k, j) =>
    `<circle data-nudo="${j}" cx="${n(P(c.puntos[k]).x)}" cy="${n(P(c.puntos[k]).y)}" r="3.2"
       fill="var(--card)" stroke="var(--cuerpo)" stroke-width="2.2"/>
     <circle data-toque="${esc(k)}" data-nudo2="${j}"
       cx="${n(P(c.puntos[k]).x)}" cy="${n(P(c.puntos[k]).y)}" r="17"
       fill="transparent" style="cursor:pointer"><title>${esc(k)}</title></circle>
     <circle data-halo="${esc(k)}" cx="${n(P(c.puntos[k]).x)}" cy="${n(P(c.puntos[k]).y)}" r="11"
       fill="none" stroke="var(--marca)" stroke-width="2.5" opacity="0"/>`).join("");

  /* El brazo de palanca es el protagonista del dibujo, así que va en su
     propio color, sólido, con la medida en una pastilla y el ángulo recto
     marcado en el pie de la perpendicular: sin ese cuadradito no se ve
     que es una distancia perpendicular y no una línea cualquiera. */
  /* El rótulo de los newton se dibuja al final, encima del cuerpo: dentro
     del grupo de la carga iba antes que los segmentos y el muslo lo tapaba. */
  const fuerzaEt = c.carga && opt && opt.newtons > 0 ? (()=>{
    const q = P(c.carga);
    return `
      <g data-fuerza transform="translate(${n(q.x)},${n(altoFuerza(q, enc, tPal))})">
        <rect x="-27" y="-9" width="54" height="18" rx="5" fill="var(--tx)"/>
        <text x="0" y="4.5" text-anchor="middle" font-size="11" font-weight="800"
              fill="var(--bg)">${Math.round(opt.newtons)} N</text>
      </g>`;
  })() : "";

  const pal = c.palanca ? (()=>{
    const A = P(c.palanca.J), B = P(c.palanca.Q);
    const t = tPal;
    return `
      <line data-pal x1="${n(A.x)}" y1="${n(A.y)}" x2="${n(B.x)}" y2="${n(B.y)}"
            stroke="var(--marca)" stroke-width="3.5" stroke-linecap="round"/>
      <path data-recto d="${escuadra(A, B)}" fill="none" stroke="var(--marca)"
            stroke-width="1.6" stroke-opacity=".9"/>
      <g data-pill transform="translate(${n(t.x)},${n(t.y)})">
        <rect x="${-t.w/2}" y="-9" width="${t.w}" height="18" rx="5" fill="var(--marca)"/>
        <text data-cm x="0" y="4.5" text-anchor="middle" font-size="11"
          font-weight="800" fill="#fff">${c.palanca.cm.toFixed(0)} cm</text>
      </g>
      <circle data-art cx="${n(A.x)}" cy="${n(A.y)}" r="${n(0.035*enc.e)}"
        fill="var(--bg)" stroke="#fff" stroke-width="2.5"/>`;
  })() : "";

  return `<svg viewBox="0 0 320 ${enc.alto}" class="dibujo" role="img"
      data-patron="${esc(m.patron)}"
      aria-label="Esquema de la posición, la línea de la carga y el brazo de palanca">
    ${piso}${apoyos}${escena}${carga}${sujeta}${pie}${segmentos}${musculos}${cab}${pal}${fuerzaEt}${nudos}
  </svg>`;
}

/* Mueve un esquema ya dibujado. Sin tocar el HTML: solo atributos, que es
   lo que permite animarlo sin que parpadee. */
function moverFigura(svg, r, i, m, enc){
  const c = cuadro(r, i, m);
  if(!svg || !c || !enc) return;
  const P = v => px(enc, v);
  const pon = (el, a, v) => { if(el) el.setAttribute(a, v.toFixed(1)); };

  if(c.carga){
    const q = P(c.carga);
    const l = svg.querySelector("[data-lcarga]");
    pon(l, "x1", q.x); pon(l, "x2", q.x);
    const d = svg.querySelector("[data-carga]");
    pon(d, "cx", q.x); pon(d, "cy", q.y);
    const gf = svg.querySelector("[data-fuerza]");
    if(gf){
      const tp = c.palanca
        ? etiquetaPalanca(P(c.palanca.J), P(c.palanca.Q), c.palanca.cm) : null;
      gf.setAttribute("transform",
        `translate(${q.x.toFixed(1)},${altoFuerza(q, enc, tp).toFixed(1)})`);
    }
    const gi = svg.querySelector("[data-imp]");
    if(gi) gi.setAttribute("transform", `translate(${q.x.toFixed(1)},${q.y.toFixed(1)})`);
    /* El cable sí cambia de largo: su anclaje está quieto. */
    const t = svg.querySelector("[data-tirante]");
    if(t && t.tagName === "line"){ pon(t, "x1", q.x); pon(t, "y1", q.y); pon(t, "x2", q.x); }
    else if(t){
      const fin = enc.alto - 14, n = 7, paso = (fin - q.y)/n;
      let dd = `M ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
      for(let k = 1; k <= n; k++)
        dd += ` L ${(q.x + (k % 2 ? 7 : -7)).toFixed(1)} ${(q.y + paso*k).toFixed(1)}`;
      t.setAttribute("d", dd);
    }
    const an = svg.querySelector("[data-ancla]");
    if(an) pon(an, "x", q.x - 13);
  }
  if(c.sujeta){
    const a = P(c.sujeta[0]), b = P(c.sujeta[1]);
    const l = svg.querySelector("[data-sujeta]");
    pon(l, "x1", a.x); pon(l, "y1", a.y); pon(l, "x2", b.x); pon(l, "y2", b.y);
  }
  c.unir.filter(([a,b]) => c.puntos[a] && c.puntos[b]).forEach(([a,b], k)=>{
    const A = P(c.puntos[a]), B = P(c.puntos[b]);
    /* Dos líneas por segmento —el halo y el trazo— y las dos se mueven. */
    svg.querySelectorAll(`[data-seg="${k}"]`).forEach(l => {
      pon(l, "x1", A.x); pon(l, "y1", A.y); pon(l, "x2", B.x); pon(l, "y2", B.y);
    });
  });
  const q = piezaPie(c, enc, m, r.cuerpo);
  if(q){
    const pts = q.pts.map(v=>`${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(" ");
    svg.querySelectorAll("[data-pie],[data-piehalo]").forEach(l => {
      l.setAttribute("points", pts);
      l.setAttribute("stroke-width", (q.w + (l.hasAttribute("data-piehalo") ? 3.4 : 0)).toFixed(1));
    });
  }
  apoyosDe(c, enc, m).forEach((a, k) => {
    const el = svg.querySelector(`[data-apoyo="${k}"]`);
    if(!el) return;
    if(a.barra){ pon(el, "cx", a.v.x); pon(el, "cy", a.v.y); }
    else { pon(el, "x", a.x - a.ancho/2); pon(el, "y", a.y);
           pon(el, "height", Math.max(2, a.alto)); }
  });

  /* La escena —torso, cabeza y mueble— se rehace entera: son cuatro
     trazos y no vale la pena moverlos uno a uno. */
  if(m.escena){
    const viejos = svg.querySelectorAll("[data-mueble],[data-mueble2],[data-tronco],[data-cabezaEsc]");
    if(viejos.length){
      const tmp = document.createElementNS("http://www.w3.org/2000/svg","g");
      tmp.innerHTML = escenaDe(c, enc, m, r.cuerpo);
      const nuevos = [...tmp.children];
      viejos.forEach((el, k) => { const z = nuevos[k]; if(!z) return;
        for(const at of z.getAttributeNames()) el.setAttribute(at, z.getAttribute(at)); });
    }
  }

  const usadosM = new Map();
  svg.querySelectorAll("[data-musculo]").forEach(l => {
    const b = bandaMusculo(c, enc, l.dataset.musculo, usadosM);
    if(!b) return;
    pon(l, "x1", b.x1); pon(l, "y1", b.y1);
    pon(l, "x2", b.x2); pon(l, "y2", b.y2);
    pon(l, "stroke-width", b.w);
  });
  if(c.puntos.hombro && (c.puntos.cadera || c.puntos.pies)){
    const h = P(c.puntos.hombro), o = P(c.puntos.cadera || c.puntos.pies);
    const dx = h.x-o.x, dy = h.y-o.y, L = Math.hypot(dx,dy) || 1, rr = 0.098*enc.e;
    const cb = svg.querySelector("[data-cabeza]");
    pon(cb, "cx", h.x + dx/L*rr*1.5); pon(cb, "cy", h.y + dy/L*rr*1.5);
  }
  Object.keys(c.puntos).filter(k => c.puntos[k]).forEach((k, j)=>{
    const v = P(c.puntos[k]);
    const o = svg.querySelector(`[data-nudo="${j}"]`);
    pon(o, "cx", v.x); pon(o, "cy", v.y);
    for(const sel of [`[data-nudo2="${j}"]`, `[data-halo="${k}"]`]){
      const q = svg.querySelector(sel);
      pon(q, "cx", v.x); pon(q, "cy", v.y);
    }
  });
  if(c.palanca){
    const A = P(c.palanca.J), B = P(c.palanca.Q);
    const l = svg.querySelector("[data-pal]");
    pon(l, "x1", A.x); pon(l, "y1", A.y); pon(l, "x2", B.x); pon(l, "y2", B.y);
    const t = etiquetaPalanca(A, B, c.palanca.cm);
    const g = svg.querySelector("[data-pill]");
    if(g) g.setAttribute("transform", `translate(${t.x.toFixed(1)},${t.y.toFixed(1)})`);
    const tx = svg.querySelector("[data-cm]");
    if(tx) tx.textContent = c.palanca.cm.toFixed(0) + " cm";
    const e2 = svg.querySelector("[data-recto]");
    if(e2) e2.setAttribute("d", escuadra(A, B));
    const ar = svg.querySelector("[data-art]");
    pon(ar, "cx", A.x); pon(ar, "cy", A.y);
  }
}

/* Lo mismo para el cursor de la curva. */
function moverCurva(svg, r, i, opt){
  if(!svg) return;
  const o = opt || {};
  const H = o.alto || 156, IZQ = 36, DER = 10, ARR = 22, ABA = 26, W = 320;
  const xs = r.puntos.map(q=>q.ang);
  const a0 = Math.min(...xs), a1 = Math.max(...xs);
  const tope = Math.max(1, ...r.puntos.map(q => Math.max(q.torque, q.torque2||0)));
  const g = {X: a => IZQ + (W-IZQ-DER)*(a-a0)/((a1-a0)||1),
             Y: t => ARR + (H-ARR-ABA)*(1 - t/tope)};
  const p = r.puntos[i];
  const x = g.X(p.ang);
  const l = svg.querySelector("[data-cur]");
  if(l){ l.setAttribute("x1", x.toFixed(1)); l.setAttribute("x2", x.toFixed(1)); }
  const a = svg.querySelector("[data-cura]");
  if(a){ a.setAttribute("cx", x.toFixed(1)); a.setAttribute("cy", g.Y(p.torque).toFixed(1)); }
  const b = svg.querySelector("[data-curb]");
  if(b){ b.setAttribute("cx", x.toFixed(1)); b.setAttribute("cy", g.Y(p.torque2||0).toFixed(1)); }
}

/* ---------- el reproductor ----------
   Una repetición, no un barrido lineal: baja algo más lento de lo que
   sube y se detiene un instante en cada extremo, que es como se mueve
   alguien que entrena. */
function reproductor(alCambiar, opt){
  const o = opt || {};
  const total = o.duracion || 2600;        // ida y vuelta
  let inicio = 0, id = 0, vivo = false;

  const suave = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
  function paso(ahora){
    if(!vivo) return;
    if(!inicio) inicio = ahora;
    const t = ((ahora - inicio) % total) / total;
    /* 0 → 1 → 0, con una pausa corta arriba y abajo. */
    const u = t < .46 ? suave(t/.46)
            : t < .54 ? 1
            : t < .96 ? 1 - suave((t-.54)/.42)
            : 0;
    alCambiar(u);
    id = requestAnimationFrame(paso);
  }
  return {
    play(){ if(vivo) return; vivo = true; inicio = 0; id = requestAnimationFrame(paso); },
    pausa(){ vivo = false; cancelAnimationFrame(id); },
    get activo(){ return vivo; }
  };
}


/* ---------- la vista de frente ----------
   Las alturas salen del plano del movimiento —así las dos vistas hablan
   de la misma postura— y las posiciones laterales, del motor frontal.
   El muslo sale más corto de lo que es: visto de frente está escorzado,
   y eso es correcto, no un error de dibujo.                            */
function figuraFrontal(r, i, m, cuerpo, opt){
  const fr = r.frontal;
  if(!fr) return "";
  const alto = (opt && opt.alto) || 250;
  const g = (r.puntos[i] || {}).geo || {};
  const L = cuerpo.L;

  /* Subidas verticales de cada tramo, tomadas de la postura real. */
  let subePierna, subeMuslo, subeTorso;
  if(m.patron === "piernas" && g.tobillo){
    subePierna = g.rodilla.y - g.tobillo.y;
    subeMuslo  = g.cadera.y  - g.rodilla.y;
    subeTorso  = g.hombro.y  - g.cadera.y;
  }else{
    /* La prensa va tumbada: se escorza a ojo para que la vista frontal
       siga teniendo sentido como plano de apoyo. */
    const D = g.K ? Math.hypot(g.K.x, g.K.y) : L.muslo;
    subePierna = L.pierna*0.7; subeMuslo = D*0.55; subeTorso = 0;
  }

  const yT = 0, yR = yT + subePierna, yC = yR + subeMuslo, yH = yC + subeTorso;
  /* A una pierna solo hay una debajo: la otra está atrás, en un banco o
     en el aire. Dibujarlas simétricas decía lo contrario de lo que dice
     el modelo, que es precisamente que el pie queda bajo la línea media. */
  const una = fr.unaPierna;
  const lado = (sg, libre) => ({
    pie:    {x: libre ? sg*0.20 : sg*fr.xPie,     y: libre ? yT + 0.18 : yT},
    rodilla:{x: libre ? sg*0.17 : sg*fr.xRodilla, y: libre ? yR + 0.14 : yR},
    cadera: {x: sg*fr.xCadera,  y: yC},
    hombro: {x: sg*0.129*cuerpo.H, y: yH}
  });
  const D = lado(1, false), I = lado(-1, una);

  /* Encuadre, con aire para la silueta. */
  const todos = [D, I].flatMap(o => Object.values(o));
  const xs = todos.map(v=>v.x), ys = todos.map(v=>v.y);
  const aire = 0.30;
  const x0 = Math.min(...xs)-aire, x1 = Math.max(...xs)+aire;
  const y0 = Math.min(...ys)-aire, y1 = Math.max(...ys)+aire;
  const e = Math.min(300/Math.max(0.5, x1-x0), (alto-20)/Math.max(0.5, y1-y0));
  const OX = 160 - (x0+x1)/2*e, OY = alto/2 + (y0+y1)/2*e;
  const P = v => ({x: OX + v.x*e, y: OY - v.y*e});
  const n = v => v.toFixed(1);

  /* De frente, los mismos anchos que de perfil: el dibujo era el doble de
     grueso y la marca del brazo de palanca —que aquí son ocho centímetros—
     desaparecía dentro de la pierna. */
  const hueso = (A, B, w) => {
    const xy = `x1="${n(A.x)}" y1="${n(A.y)}" x2="${n(B.x)}" y2="${n(B.y)}"`;
    return `<line ${xy} stroke="var(--card)" stroke-width="${n(w*e + 3.4)}"
              stroke-linecap="round"/>
            <line ${xy} stroke="var(--cuerpo)" stroke-opacity=".92"
              stroke-width="${n(w*e)}" stroke-linecap="round"/>`;
  };
  const pierna = (o, tenue) => {
    const T = P(o.pie), R = P(o.rodilla), C = P(o.cadera);
    const op = tenue ? ' opacity=".38"' : "";
    return `<g${op}>
      ${hueso(T, R, 0.064)}
      ${hueso(R, C, 0.098)}
      ${hueso({x:T.x - 0.055*e, y:T.y}, {x:T.x + 0.055*e, y:T.y}, 0.05)}</g>`;
  };

  const C0 = P({x:0, y:yC}), H0 = P({x:0, y:yH});
  const tronco = subeTorso > 0.05 ? `
    ${hueso(C0, H0, 0.17)}
    ${hueso(P(D.hombro), P(I.hombro), 0.07)}
    <circle cx="${n(H0.x)}" cy="${n(H0.y - 0.165*e)}" r="${n(0.098*e)}"
            fill="var(--card)" stroke="var(--cuerpo)" stroke-opacity=".92"
            stroke-width="2.6"/>` : "";
  const pelvis = hueso(P(D.cadera), P(I.cadera), 0.08);

  /* Los dos brazos de palanca del plano frontal, en la pierna derecha. */
  /* Las marcas se separan un poco de la articulación: dibujadas justo
     encima quedaban tapadas por el grosor de la pierna. */
  const marca = (A, B, txt, sep) => {
    if(Math.abs(A.x-B.x) < 0.02) return "";
    const a = P(A), b = P(B), y = a.y + sep, mx = (a.x+b.x)/2;
    return `
      <line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(a.x)}" y2="${n(y)}"
            stroke="var(--marca)" stroke-opacity=".5" stroke-width="1.4" stroke-dasharray="3 3"/>
      <line x1="${n(b.x)}" y1="${n(b.y)}" x2="${n(b.x)}" y2="${n(y)}"
            stroke="var(--marca)" stroke-opacity=".5" stroke-width="1.4" stroke-dasharray="3 3"/>
      <line x1="${n(a.x)}" y1="${n(y)}" x2="${n(b.x)}" y2="${n(y)}"
            stroke="var(--marca)" stroke-width="3" stroke-linecap="round"/>
      <g transform="translate(${n(mx)},${n(y)})">
        <rect x="-21" y="-9" width="42" height="18" rx="5" fill="var(--marca)"/>
        <text x="0" y="4.5" text-anchor="middle" font-size="11" font-weight="800"
              fill="#fff">${txt}</text>
      </g>`;
  };

  const nudo = (v, clave) => {
    const q = P(v);
    return `<circle cx="${n(q.x)}" cy="${n(q.y)}" r="3.2" fill="var(--card)"
              stroke="var(--cuerpo)" stroke-width="2.2"/>
            <circle data-toque="${clave}" cx="${n(q.x)}" cy="${n(q.y)}" r="17"
              fill="transparent" style="cursor:pointer"><title>${clave}</title></circle>
            <circle data-halo="${clave}" cx="${n(q.x)}" cy="${n(q.y)}" r="11" fill="none"
              stroke="var(--marca)" stroke-width="2.5" opacity="0"/>`;
  };

  const suelo = P({x:0, y:yT});
  return `<svg viewBox="0 0 320 ${alto}" class="dibujo" role="img"
      aria-label="Vista de frente: ancho de los pies y seguimiento de la rodilla">
    <line x1="8" y1="${n(suelo.y)}" x2="312" y2="${n(suelo.y)}"
          stroke="currentColor" stroke-opacity=".2" stroke-width="2"/>
    <line x1="${n(P({x:0,y:y1}).x)}" y1="${n(P({x:0,y:y1}).y)}"
          x2="${n(P({x:0,y:y0}).x)}" y2="${n(P({x:0,y:y0}).y)}"
          stroke="currentColor" stroke-opacity=".18" stroke-width="1" stroke-dasharray="4 5"/>
    ${pierna(I, una)}${pierna(D, false)}${pelvis}${tronco}
    ${marca(D.cadera, D.pie, `${Math.round(fr.cadera.brazo*100)} cm`, -0.17*e)}
    ${marca(D.rodilla, D.pie, `${Math.round(fr.rodilla.brazo*100)} cm`, 0.17*e)}
    ${nudo(D.cadera, "caderaF")}${nudo(D.rodilla, "rodillaF")}
  </svg>`;
}

global.COACH_ALE_GRAFICO = {curva, chispa, figura: figuraSVG, frontal: figuraFrontal,
  encuadre, moverFigura, moverCurva, reproductor};
})(window);
