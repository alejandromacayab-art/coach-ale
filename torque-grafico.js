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
    for(const v of vs){
      if(v.x < x0) x0 = v.x; if(v.x > x1) x1 = v.x;
      if(v.y < y0) y0 = v.y; if(v.y > y1) y1 = v.y;
    }
    if(c.suelo != null && c.suelo < y0) y0 = c.suelo;
  }
  if(!hay) return null;
  /* Margen: el cuerpo no es una línea, es una silueta con grosor, y la
     cabeza y el implemento sobresalen de las articulaciones. Sin esto se
     salía del marco por los cuatro lados. */
  const aire = 0.20;
  x0 -= aire; x1 += aire; y0 -= aire; y1 += aire;
  const ancho = Math.max(0.5, x1-x0), altoReal = Math.max(0.5, y1-y0);
  const e = Math.min(300/ancho, (alto-20)/altoReal);
  return {e, alto,
          OX: 160 - (x0+x1)/2*e,
          OY: alto/2 + (y0+y1)/2*e};
}

const px = (enc, v) => ({x: enc.OX + v.x*enc.e, y: enc.OY - v.y*enc.e});

/* Grosor de cada segmento, en metros de verdad. */
const GROSOR = {cadera:0.26, rodilla:0.16, tobillo:0.11, hombro:0.20,
                codo:0.095, manos:0.075, mano:0.075, pie:0.11, pies:0.11,
                pivote:0.12, extremo:0.085};
function grosor(a, b, enc){
  const g = ((GROSOR[a] || 0.13) + (GROSOR[b] || 0.13))/2;
  return Math.max(5, g*enc.e).toFixed(1);
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
     tamaño del disco, y a escala del cuerpo se nota. */
  if(eq === "Barra")
    return {svg:`<circle r="${d(0.22)}" ${col}/><circle r="${d(0.045)}" fill="var(--card)"/>`};
  if(eq === "Mancuernas")
    return {svg:`<circle r="${d(0.115)}" ${col}/><circle r="${d(0.03)}" fill="var(--card)"/>`};
  if(eq === "Máquina")
    return {svg:`<rect x="${d(-0.11)}" y="${d(-0.055)}" width="${d(0.22)}" height="${d(0.11)}"
                   rx="${d(0.04)}" ${col}/>`};
  if(eq === "Polea")
    return {svg:`<circle r="${d(0.075)}" ${col}/>`, tirante:"cable"};
  if(eq === "Banda elástica")
    return {svg:`<circle r="${d(0.055)}" ${col}/>`, tirante:"banda"};
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
  const carga = c.carga ? (()=>{
    const q = P(c.carga);
    return `
    <line data-lcarga x1="${n(q.x)}" y1="0" x2="${n(q.x)}" y2="${enc.alto}"
          stroke="currentColor" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="6 5"/>
    ${opt && opt.newtons > 0 ? `
      <g data-fuerza transform="translate(${n(q.x)},${n(Math.max(16, q.y - 0.30*enc.e))})">
        <rect x="-27" y="-9" width="54" height="18" rx="5"
              fill="var(--tx)" fill-opacity=".82"/>
        <text x="0" y="4.5" text-anchor="middle" font-size="11" font-weight="800"
              fill="var(--bg)">${Math.round(opt.newtons)} N</text>
      </g>` : ""}
    ${imp && imp.tirante ? tirante(imp.tirante, q.x, q.y, enc.alto) : ""}
    ${imp ? `<g data-imp transform="translate(${n(q.x)},${n(q.y)})">${imp.svg}</g>`
          : `<circle data-carga cx="${n(q.x)}" cy="${n(q.y)}" r="7"
               fill="var(--q0)" fill-opacity=".85"/>`}`;
  })() : "";

  const sujeta = c.sujeta ? `
    <line data-sujeta x1="${n(P(c.sujeta[0]).x)}" y1="${n(P(c.sujeta[0]).y)}"
          x2="${n(P(c.sujeta[1]).x)}" y2="${n(P(c.sujeta[1]).y)}"
          stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-opacity=".45"/>` : "";

  /* Cada segmento con su grosor real: el muslo no es tan ancho como el
     antebrazo, y con las puntas redondeadas el conjunto se lee como un
     cuerpo y no como un diagrama de palitos. */
  const segmentos = unir.map(([a,b], k) =>
    `<line data-seg="${k}" x1="${n(P(c.puntos[a]).x)}" y1="${n(P(c.puntos[a]).y)}"
       x2="${n(P(c.puntos[b]).x)}" y2="${n(P(c.puntos[b]).y)}"
       stroke="var(--cuerpo)" stroke-width="${grosor(a, b, enc)}"
       stroke-linecap="round"/>`).join("");

  /* La cabeza, donde haya tronco: sin ella la silueta no se sabe de qué
     lado mira. */
  const cab = c.puntos.hombro && (c.puntos.cadera || c.puntos.pies) ? (()=>{
    const h = P(c.puntos.hombro), o = P(c.puntos.cadera || c.puntos.pies);
    const dx = h.x-o.x, dy = h.y-o.y, L = Math.hypot(dx,dy) || 1;
    const rr = 0.105*enc.e;
    return `<circle data-cabeza cx="${n(h.x + dx/L*rr*1.5)}" cy="${n(h.y + dy/L*rr*1.5)}"
              r="${n(rr)}" fill="var(--cuerpo)"/>`;
  })() : "";

  /* Cada articulación con su nombre y un área de toque generosa: en un
     teléfono un círculo de cuatro píxeles no se acierta nunca. */
  const nudos = nombres.map((k, j) =>
    `<circle data-nudo="${j}" cx="${n(P(c.puntos[k]).x)}" cy="${n(P(c.puntos[k]).y)}" r="4"
       fill="none" stroke="var(--bg)" stroke-opacity=".55" stroke-width="2"/>
     <circle data-toque="${esc(k)}" data-nudo2="${j}"
       cx="${n(P(c.puntos[k]).x)}" cy="${n(P(c.puntos[k]).y)}" r="17"
       fill="transparent" style="cursor:pointer"><title>${esc(k)}</title></circle>
     <circle data-halo="${esc(k)}" cx="${n(P(c.puntos[k]).x)}" cy="${n(P(c.puntos[k]).y)}" r="11"
       fill="none" stroke="var(--marca)" stroke-width="2.5" opacity="0"/>`).join("");

  /* El brazo de palanca es el protagonista del dibujo, así que va en su
     propio color, sólido, con la medida en una pastilla y el ángulo recto
     marcado en el pie de la perpendicular: sin ese cuadradito no se ve
     que es una distancia perpendicular y no una línea cualquiera. */
  const pal = c.palanca ? (()=>{
    const A = P(c.palanca.J), B = P(c.palanca.Q);
    const t = etiquetaPalanca(A, B, c.palanca.cm);
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
    ${piso}${carga}${sujeta}${segmentos}${cab}${pal}${nudos}
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
    if(gf) gf.setAttribute("transform",
      `translate(${q.x.toFixed(1)},${Math.max(16, q.y - 0.30*enc.e).toFixed(1)})`);
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
    const l = svg.querySelector(`[data-seg="${k}"]`);
    pon(l, "x1", A.x); pon(l, "y1", A.y); pon(l, "x2", B.x); pon(l, "y2", B.y);
  });
  if(c.puntos.hombro && (c.puntos.cadera || c.puntos.pies)){
    const h = P(c.puntos.hombro), o = P(c.puntos.cadera || c.puntos.pies);
    const dx = h.x-o.x, dy = h.y-o.y, L = Math.hypot(dx,dy) || 1, rr = 0.105*enc.e;
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

  const pierna = (o, tenue) => {
    const T = P(o.pie), R = P(o.rodilla), C = P(o.cadera);
    const op = tenue ? ' opacity=".38"' : "";
    return `<g${op}>
      <line x1="${n(T.x)}" y1="${n(T.y)}" x2="${n(R.x)}" y2="${n(R.y)}"
            stroke="var(--cuerpo)" stroke-width="${n(0.135*e)}" stroke-linecap="round"/>
      <line x1="${n(R.x)}" y1="${n(R.y)}" x2="${n(C.x)}" y2="${n(C.y)}"
            stroke="var(--cuerpo)" stroke-width="${n(0.21*e)}" stroke-linecap="round"/>
      <line x1="${n(T.x - 0.06*e)}" y1="${n(T.y)}" x2="${n(T.x + 0.06*e)}" y2="${n(T.y)}"
            stroke="var(--cuerpo)" stroke-width="${n(0.085*e)}" stroke-linecap="round"/></g>`;
  };

  const C0 = P({x:0, y:yC}), H0 = P({x:0, y:yH});
  const tronco = subeTorso > 0.05 ? `
    <line x1="${n(C0.x)}" y1="${n(C0.y)}" x2="${n(H0.x)}" y2="${n(H0.y)}"
          stroke="var(--cuerpo)" stroke-width="${n(0.30*e)}" stroke-linecap="round"/>
    <line x1="${n(P(D.hombro).x)}" y1="${n(P(D.hombro).y)}"
          x2="${n(P(I.hombro).x)}" y2="${n(P(I.hombro).y)}"
          stroke="var(--cuerpo)" stroke-width="${n(0.12*e)}" stroke-linecap="round"/>
    <circle cx="${n(H0.x)}" cy="${n(H0.y - 0.17*e)}" r="${n(0.105*e)}" fill="var(--cuerpo)"/>` : "";
  const pelvis = `<line x1="${n(P(D.cadera).x)}" y1="${n(P(D.cadera).y)}"
      x2="${n(P(I.cadera).x)}" y2="${n(P(I.cadera).y)}"
      stroke="var(--cuerpo)" stroke-width="${n(0.14*e)}" stroke-linecap="round"/>`;

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
    return `<circle cx="${n(q.x)}" cy="${n(q.y)}" r="4" fill="none"
              stroke="var(--bg)" stroke-opacity=".55" stroke-width="2"/>
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
