/* Motor de biomecánica de Coach Ale
   ---------------------------------
   Calcula cuánto torque tiene que aguantar cada articulación en cada
   ejercicio, con las medidas de la persona que está entrenando.

   De dónde salen las proporciones: las tablas antropométricas de Dempster,
   tal como las publica Winter en "Biomechanics and Motor Control of Human
   Movement". Son promedios de población adulta, no la medida de nadie en
   particular: sirven para que el cálculo use un cuerpo del porte correcto,
   no para decirte cuánto mide tu fémur.

   Qué es el torque y por qué importa: un músculo no levanta kilos, aguanta
   giros. El giro que tiene que aguantar es el peso por la distancia
   perpendicular entre la articulación y la línea por donde tira ese peso.
   Esa distancia es el brazo de palanca. Mismo peso, distinto brazo,
   distinto esfuerzo — y por eso mover el pie, la mano o el torso cambia
   qué músculo trabaja aunque los kilos sean los mismos. */

(function(global){
"use strict";

const G = 9.81;
const RAD = Math.PI/180;
const sin = a => Math.sin(a*RAD), cos = a => Math.cos(a*RAD);

/* ============================================================
   1. ANTROPOMETRÍA
   Largos como fracción de la estatura, masas como fracción del
   peso corporal, y el centro de masa de cada segmento como
   fracción de su largo medida desde el extremo de arriba.
   ============================================================ */

const LARGO = {          // × estatura
  brazo:     0.186,      // hombro → codo
  antebrazo: 0.146,      // codo → muñeca
  mano:      0.108,      // muñeca → punta de los dedos
  muslo:     0.245,      // cadera → rodilla
  pierna:    0.246,      // rodilla → tobillo
  pie:       0.152,      // largo del pie
  tobillo:   0.039,      // suelo → tobillo
  tronco:    0.288,      // cadera → hombro
  cabeza:    0.130,      // hombro → centro de la cabeza
  hombros:   0.259       // ancho entre hombros
};

const MASA = {           // × peso corporal
  brazo:0.028, antebrazo:0.016, mano:0.006,
  muslo:0.100, pierna:0.0465, pie:0.0145,
  tronco:0.497, cabeza:0.081
};

const COM = {            // × largo del segmento, desde el extremo de arriba
  brazo:0.436, antebrazo:0.430, mano:0.506,
  muslo:0.433, pierna:0.433, pie:0.500,
  tronco:0.500, cabeza:0.500
};

/* Agarre: la mano no sujeta en la punta de los dedos sino cerca de los
   nudillos, a algo menos de la mitad del largo de la mano. */
const AGARRE = 0.45;

function cuerpoDe(alturaCm, pesoKg){
  const H = Math.max(1.30, Math.min(2.20, (alturaCm||170)/100));
  const M = Math.max(30, Math.min(200, pesoKg||70));
  const L = {}, m = {};
  for(const k in LARGO) L[k] = LARGO[k]*H;
  for(const k in MASA)  m[k] = MASA[k]*M;

  /* Largos compuestos que se usan todo el rato. */
  L.antebrazoMano = L.antebrazo + L.mano*AGARRE;   // codo → agarre
  L.brazoEntero   = L.brazo + L.antebrazoMano;     // hombro → agarre
  L.piernaEntera  = L.muslo + L.pierna;            // cadera → tobillo
  m.antebrazoMano = m.antebrazo + m.mano;
  m.brazoEntero   = m.brazo + m.antebrazoMano;
  m.piernaEntera  = m.muslo + m.pierna + m.pie;
  m.torso         = m.tronco + m.cabeza;           // tronco + cabeza + cuello

  /* Centro de masa de los compuestos, desde el extremo de arriba. */
  L.comAntebrazoMano = (m.antebrazo*L.antebrazo*COM.antebrazo +
                        m.mano*(L.antebrazo + L.mano*COM.mano)) / m.antebrazoMano;
  L.comBrazoEntero   = (m.brazo*L.brazo*COM.brazo +
                        m.antebrazoMano*(L.brazo + L.comAntebrazoMano)) / m.brazoEntero;
  L.comPiernaEntera  = (m.muslo*L.muslo*COM.muslo +
                        m.pierna*(L.muslo + L.pierna*COM.pierna) +
                        m.pie*(L.muslo + L.pierna)) / m.piernaEntera;
  L.comTorso         = (m.tronco*L.tronco*COM.tronco +
                        m.cabeza*(L.tronco + L.cabeza*COM.cabeza)) / m.torso;

  return {H, M, L, m, alturaCm:Math.round(H*100), pesoKg:Math.round(M)};
}

/* ============================================================
   2. HERRAMIENTAS DE ESTÁTICA
   Todo en el plano del movimiento: x horizontal, y hacia arriba.
   Un peso tira siempre hacia abajo, así que el brazo de palanca
   de un peso respecto a una articulación es la distancia
   horizontal entre los dos.
   ============================================================ */

/* Torque (N·m) de una lista de pesos respecto a un punto.
   pesos: [{kg, x, y}], punto: {x, y}. Signo: positivo = tiende a
   girar en sentido antihorario. */
function torqueDe(pesos, punto){
  return pesos.reduce((t, w) => t + w.kg*G*(w.x - punto.x), 0);
}
const kilos = pesos => pesos.reduce((a,w)=>a+w.kg, 0);
const comDe = pesos => {
  const k = kilos(pesos) || 1;
  return {x: pesos.reduce((a,w)=>a+w.kg*w.x,0)/k, y: pesos.reduce((a,w)=>a+w.kg*w.y,0)/k};
};

/* ============================================================
   3. LOS CUATRO MODELOS
   ============================================================ */

/* ---- A. ROTACIÓN -----------------------------------------------------
   Un segmento gira alrededor de una articulación y la carga cuelga del
   extremo. El brazo de palanca es el largo del segmento por el seno del
   ángulo que forma con la vertical: pegado a la vertical no pesa nada,
   horizontal pesa todo.

   `offset` inclina el punto de partida: es lo que diferencia un curl de
   pie (el brazo cuelga vertical) de uno en banca Scott (el brazo ya
   arranca inclinado hacia adelante, así que el ejercicio empieza duro).  */
function modeloRotacion(ej, cuerpo, carga, op){
  const {L, m} = cuerpo;
  const largo = ej.largo(L);
  const com   = ej.com ? ej.com(L) : largo*0.45;
  const masaS = ej.masa ? ej.masa(m) : 0;
  const porLado = ej.lados === 2 ? 0.5 : 1;
  const kgCarga = carga*porLado + (ej.corporal ? cuerpo.M*ej.corporal : 0);

  const puntos = [];
  const [a0, a1] = ej.rango;
  for(let i=0; i<=40; i++){
    const ang = a0 + (a1-a0)*i/40;
    const inc = op && op.inclinacion != null ? op.inclinacion : (ej.offset||0);
    const phi = Math.abs(ang + inc);                  // ángulo con la vertical
    const sp = Math.abs(sin(phi));
    const brazoCarga = largo*sp;
    const brazoSeg   = com*sp;
    /* Geometría para el dibujo: el eje de giro arriba y el segmento
       colgando con el ángulo que toque. */
    const geo = {pivote:{x:0, y:0},
                 extremo:{x: largo*sin(phi), y: -largo*cos(phi)},
                 centro:{x: com*sin(phi), y: -com*cos(phi)}};
    puntos.push({
      ang, geo,
      brazo: brazoCarga,
      torque: (kgCarga*brazoCarga + masaS*brazoSeg)*G
    });
  }
  return {puntos, art: ej.art, musc: ej.musc, unidad:"°", ejeX: ej.ejeX || "Ángulo"};
}

/* ---- B. BRAZOS -------------------------------------------------------
   Press y tirones: la carga está en las manos y hay que ver qué le toca
   al hombro y qué al codo. La mano recorre un camino y en cada punto se
   mide la distancia horizontal de la carga a cada articulación.

   El ángulo del slider es el del brazo (hombro → codo) respecto a la
   vertical; de ahí sale el codo, y la mano se obtiene cerrando el
   triángulo hasta el punto donde la carga tiene que estar.            */
function modeloBrazos(ej, cuerpo, carga, op){
  const {L, m} = cuerpo;
  const porLado = ej.lados === 2 ? 0.5 : 1;
  const kgCarga = carga*porLado + (ej.corporal ? cuerpo.M*ej.corporal*porLado : 0);
  const puntos = [];
  const [a0, a1] = ej.rango;

  for(let i=0; i<=40; i++){
    const ang = a0 + (a1-a0)*i/40;
    const g = ej.pose(ang, L, op);       // {hombro, codo, mano} en metros
    const pesos = [
      {kg:kgCarga, x:g.mano.x, y:g.mano.y},
      {kg:m.brazo*porLado,          x:(g.hombro.x+g.codo.x)/2, y:(g.hombro.y+g.codo.y)/2},
      {kg:m.antebrazoMano*porLado,  x:(g.codo.x+g.mano.x)/2,   y:(g.codo.y+g.mano.y)/2}
    ];
    const tHombro = Math.abs(torqueDe(pesos, g.hombro));
    const tCodo   = Math.abs(torqueDe(pesos.slice(0,1).concat(pesos[2]), g.codo));
    puntos.push({ang, geo:g, torque:tHombro, torque2:tCodo,
                 brazo:Math.abs(g.mano.x - g.hombro.x)});
  }
  return {puntos, art: ej.art, art2: ej.art2, musc: ej.musc, musc2: ej.musc2,
          unidad:"°", ejeX: ej.ejeX || "Ángulo del brazo"};
}

/* ---- C. PIERNAS ------------------------------------------------------
   Sentadillas, bisagras y zancadas. El cuerpo se arma de abajo hacia
   arriba: tobillo, rodilla, cadera, hombro. Todo lo que pesa por encima
   de una articulación crea torque sobre ella, y el brazo de palanca es
   la distancia horizontal.

   La postura no se inventa: se busca el ángulo de tronco que deja el
   centro de masa de todo —cuerpo más barra— sobre el medio del pie.
   Eso es lo que hace tu cuerpo para no caerse, y es también lo que
   explica por qué una sentadilla frontal obliga a ir más erguido.     */
function esqueletoPierna(ej, cuerpo, carga, angRodilla, angTronco, correccionTibia, opc){
  const {L, m} = cuerpo;
  const tobillo = {x:0, y:L.tobillo};
  /* La tibia se inclina hacia adelante con la flexión de rodilla. */
  const incTibia = (ej.tibia ? ej.tibia(angRodilla) : (180-angRodilla)*0.55)
                 + (correccionTibia || 0);
  const rodilla = {x: tobillo.x + L.pierna*sin(incTibia), y: tobillo.y + L.pierna*cos(incTibia)};
  /* El fémur cierra el ángulo de rodilla. */
  const incFemur = incTibia - (180 - angRodilla);
  const cadera = {x: rodilla.x + L.muslo*sin(incFemur), y: rodilla.y + L.muslo*cos(incFemur)};
  const hombro = {x: cadera.x + L.tronco*sin(angTronco), y: cadera.y + L.tronco*cos(angTronco)};

  const medio = (p,q)=>({x:(p.x+q.x)/2, y:(p.y+q.y)/2});
  const lado = ej.unaPierna ? 1 : 1;     // el peso del cuerpo es el mismo
  const pesos = [
    {kg:m.pierna*2*lado, ...medio(tobillo, rodilla)},
    {kg:m.muslo*2*lado,  ...medio(rodilla, cadera)},
    {kg:m.torso,         x: cadera.x + L.comTorso*sin(angTronco),
                         y: cadera.y + L.comTorso*cos(angTronco)},
    {kg:m.brazoEntero*2, x: hombro.x, y: hombro.y}
  ];
  /* Dónde se apoya la carga: hombros, manos colgando, o pecho. */
  const pCarga = ej.cargaPos(hombro, cadera, L);
  /* Lo que la barra se aleja de la pierna se suma al brazo de palanca:
     es el error más caro del peso muerto y aquí se puede medir. */
  if(opc && opc.barra) pCarga.x += opc.barra/100;
  if(carga > 0) pesos.push({kg:carga, x:pCarga.x, y:pCarga.y});

  /* El orden es: piernas, muslos, torso, brazos y la carga. Lo que cuelga
     de una articulación es lo que viene después de ella en la cadena. */
  const encima = {
    rodilla: pesos.slice(1),
    cadera:  pesos.slice(2)
  };
  return {tobillo, rodilla, cadera, hombro, pesos, pCarga, encima, incTibia, incFemur};
}

function modeloPiernas(ej, cuerpo, carga, opc){
  const {L} = cuerpo;
  const medioPie = L.pie*0.45;             // el medio del pie, por delante del tobillo
  const puntos = [];
  const [a0, a1] = ej.rango;

  for(let i=0; i<=40; i++){
    const paso = a0 + (a1-a0)*i/40;
    /* En las bisagras —peso muerto, rumano, remo— el que manda es el
       tronco y la rodilla casi no se mueve, así que el slider es ese. */
    const porTronco = ej.eje === "tronco";
    const ang = porTronco ? (ej.rodilla ? ej.rodilla(paso) : 165) : paso;

    let tronco, correccionTibia = 0;
    if(porTronco){
      /* En una bisagra el tronco lo manda el movimiento, pero el cuerpo
         igual tiene que quedar en pie: lo que se busca entonces es cuánto
         echa la cadera hacia atrás, que es exactamente lo que haces tú
         para no caerte de narices al agacharte a levantar algo. */
      tronco = paso;
      /* Qué tiene que quedar sobre el medio del pie: con la barra colgando
         de las manos, la barra — esa es la regla del peso muerto y del
         remo, y es por lo que la barra va pegada a la pierna. Con la barra
         en los hombros, el centro de masa de todo. En los dos casos lo que
         se ajusta es cuánto echas la cadera hacia atrás. */
      let lo = -55, hi = 40;
      for(let k=0; k<30; k++){
        correccionTibia = (lo+hi)/2;
        const e = esqueletoPierna(ej, cuerpo, carga, ang, tronco, correccionTibia, opc);
        const ref = ej.anclaCarga ? e.pCarga.x : comDe(e.pesos).x;
        if(ref > medioPie) hi = correccionTibia; else lo = correccionTibia;
      }
      correccionTibia = (lo+hi)/2;
    }else if(ej.tronco){
      tronco = ej.tronco(ang);
    }else{
      let lo = 0, hi = 85;
      for(let k=0; k<30; k++){
        tronco = (lo+hi)/2;
        /* Con los ajustes puestos: si la búsqueda de equilibrio no ve dónde
           está la carga, el torso no reacciona a moverla y la sentadilla
           frontal sale idéntica a la normal. */
        const e = esqueletoPierna(ej, cuerpo, carga, ang, tronco, 0, opc);
        if(comDe(e.pesos).x > medioPie) hi = tronco; else lo = tronco;
      }
      tronco = (lo+hi)/2;
    }
    const e = esqueletoPierna(ej, cuerpo, carga, ang, tronco, correccionTibia, opc);

    /* Torque en cada articulación: todo lo que queda por encima.
       El tobillo lo calcula contra el medio del pie, que es donde
       realmente se reparte el apoyo. */
    const tRodilla = Math.abs(torqueDe(e.encima.rodilla, e.rodilla));
    const tCadera  = Math.abs(torqueDe(e.encima.cadera,  e.cadera));
    /* Respecto al tobillo, no al medio del pie: el equilibrio pone el
       centro de masa justo sobre el medio del pie, así que medirlo ahí
       daba cero siempre — un cero de construcción, no de la realidad.
       Lo que el sóleo aguanta es el peso por lo que el tobillo queda
       por detrás del apoyo. */
    const tTobillo = Math.abs(torqueDe(e.pesos, {x:0, y:e.tobillo.y}));

    /* A una pierna no se reparte a medias: en una zancada la de adelante
       se lleva la mayor parte, y eso lo dice el ejercicio. */
    const f = ej.reparto != null ? ej.reparto : 0.5;
    /* En una bisagra el número que importa es el de la cadera: va primero. */
    const cad = ej.principal === "cadera";
    puntos.push({ang: paso, angRodilla: ang, geo:e, tronco,
                 torque:  (cad ? tCadera : tRodilla)*f,
                 torque2: (cad ? tRodilla : tCadera)*f,
                 torque3: tTobillo*f,
                 brazo: Math.abs(e.pCarga.x - (cad ? e.cadera : e.rodilla).x)});
  }
  return {puntos, art: ej.art || "Rodilla", art2: ej.art2 || "Cadera", art3:"Tobillo",
          musc: ej.musc || "Cuádriceps", musc2: ej.musc2 || "Glúteo e isquios",
          musc3:"Gemelo y sóleo",
          unidad:"°", ejeX: ej.ejeX || "Ángulo de rodilla"};
}

/* ---- D. PRENSA -------------------------------------------------------
   La prensa de 45°: la plataforma es perpendicular a los rieles, así que
   el brazo de palanca de la cadera es exactamente la altura del pie
   sobre el eje que pasa por ella. El de la rodilla sale de cerrar el
   triángulo cadera-rodilla-pie.                                        */
function modeloPrensa(ej, cuerpo, carga, opciones){
  const {L} = cuerpo;
  const th = (opciones && opciones.riel) || ej.riel || 45;
  const d = {x:cos(th), y:sin(th)}, p = {x:-sin(th), y:cos(th)};
  const Lf = L.muslo, Lt = L.pierna;
  const alturaPie = ((opciones && opciones.pie) || 0)/100 + 0.16*(cuerpo.H/1.75);
  const fuerza = carga*G*sin(th);
  const puntos = [];
  const [a0, a1] = ej.rango;

  for(let i=0; i<=40; i++){
    const ang = a0 + (a1-a0)*i/40;
    const D = Math.sqrt(Lf*Lf + Lt*Lt - 2*Lf*Lt*cos(ang));
    const h = Math.min(alturaPie, D - 0.03);
    const s = Math.sqrt(Math.max(0, D*D - h*h));
    const F = {x:s*d.x + h*p.x, y:s*d.y + h*p.y};
    const u = {x:F.x/D, y:F.y/D}, n = {x:-u.y, y:u.x};
    const a = (D*D + Lf*Lf - Lt*Lt)/(2*D);
    const alto = Math.sqrt(Math.max(0, Lf*Lf - a*a));
    const K = {x:u.x*a + n.x*alto, y:u.y*a + n.y*alto};
    const rRod = (F.x-K.x)*d.y - (F.y-K.y)*d.x;
    puntos.push({ang, geo:{F, K, h, d, p}, h,
                 torque: fuerza*Math.abs(rRod)/2, torque2: fuerza*h/2,
                 flexor: rRod < 0, brazo: Math.abs(rRod)});
  }
  return {puntos, art:"Rodilla", art2:"Cadera",
          musc:"Cuádriceps", musc2:"Glúteo y aductor",
          unidad:"°", ejeX:"Ángulo de rodilla"};
}


/* ---- E. APOYOS -------------------------------------------------------
   El cuerpo apoyado en dos puntos: los pies y las manos (o los codos).
   Cuánto peso llega a las manos no es la mitad ni un número fijo: sale de
   la estática. Momento respecto al apoyo de los pies, y la fuerza en las
   manos es la que equilibra.

   De ahí sale, sin inventar nada, por qué una flexión con los pies en alto
   es más dura y una con las manos en alto más suave: no cambia tu peso,
   cambia la distancia.                                                   */
function modeloApoyos(ej, cuerpo, carga, op){
  const puntos = [];
  const [a0, a1] = ej.rango;
  for(let i=0; i<=40; i++){
    const ang = a0 + (a1-a0)*i/40;
    const g = ej.pose(ang, cuerpo, ej, op);
    const pesos = g.pesos.slice();
    if(carga > 0 && g.pCarga) pesos.push({kg:carga, x:g.pCarga.x, y:g.pCarga.y});

    const total = kilos(pesos)*G;
    const com   = comDe(pesos);
    const palanca = Math.abs(g.manos.x - g.pies.x);
    const fVertical = palanca > 0.08 ? total*Math.abs(com.x - g.pies.x)/palanca : total;

    /* El brazo no empuja hacia abajo: empuja perpendicular al cuerpo. De
       la fuerza vertical que llega a las manos, lo que el brazo tiene que
       vencer es esa componente — y por eso una flexión con las manos en
       alto es más fácil aunque el reparto del peso no cambie. Es la misma
       razón por la que subir una cuesta cuesta menos que subir una pared. */
    const inclinado = Math.cos((g.inc||0)*RAD);
    const fManos = fVertical*Math.abs(inclinado);

    /* Las distancias también se miden a lo largo del cuerpo, no en
       horizontal, porque es el eje sobre el que trabaja el brazo. */
    const eje = {x: Math.cos((g.inc||0)*RAD), y: Math.sin((g.inc||0)*RAD)};
    const alLargo = (a, b) => (a.x-b.x)*eje.x + (a.y-b.y)*eje.y;

    /* Abrir los codos saca parte del movimiento del plano del dibujo: lo
       que queda para el tríceps es la proyección. Codos pegados al cuerpo
       = casi todo; codos muy abiertos = casi nada, y el trabajo se va al
       pectoral. */
    const abre = Math.cos((op && op.apertura != null ? op.apertura
                           : (ej.apertura != null ? ej.apertura : 45))*RAD);

    /* Torque en cada articulación: se corta el cuerpo ahí y se suma lo que
       queda del lado de las manos. La fuerza de apoyo empuja hacia arriba
       y el peso de lo que haya en medio tira hacia abajo, así que se
       restan. Vale igual para el codo que para la zona lumbar. */
    const momento = llave => {
      const pt = g[llave];
      const distal = (g.distales && g.distales[llave]) || [];
      const f = llave === "codo" ? abre : 1;
      return Math.abs(fManos*alLargo(g.manos, pt)*f -
                      distal.reduce((a,w)=> a + w.kg*G*(w.x - pt.x), 0));
    };
    const llaves = ej.momentoEn || ["codo", "hombro"];
    const div = ej.divisor || [2, 2];     // dos codos, dos hombros, una lumbar
    puntos.push({ang, geo:g, fManos, fVertical,
                 torque:  momento(llaves[0])/div[0],
                 torque2: llaves[1] ? momento(llaves[1])/(div[1]||1) : null,
                 brazo: Math.abs(g.manos.x - g[llaves[0]].x),
                 porcentaje: 100*fVertical/total,
                 efectivo: 100*fManos/total});
  }
  return {puntos, art: ej.art || "Codo", art2: ej.art2 || "Hombro",
          musc: ej.musc || "Tríceps", musc2: ej.musc2 || "Pectoral y deltoides",
          unidad:"°", ejeX: ej.ejeX || "Ángulo del codo"};
}

const MOTORES = {rotacion:modeloRotacion, brazos:modeloBrazos,
                 piernas:modeloPiernas, prensa:modeloPrensa, apoyos:modeloApoyos};

/* ============================================================
   4. LO QUE SE PUEDE MOVER
   Un laboratorio sirve si puedes cambiar el montaje, no solo mirarlo.
   Cada patrón expone los ajustes que de verdad cambian la mecánica: el
   sitio donde apoyas las manos y los pies, el ancho del agarre, cuánto
   abres los codos, la inclinación del banco. Son las mismas variables
   que decide un entrenador al montar el ejercicio.
   ============================================================ */

function ajustesDe(ej, cuerpo){
  if(!ej || ej.descrito) return [];
  const H = cuerpo ? cuerpo.H : 1.72;
  const cm = f => Math.round(f*H*100);
  const L = [];

  if(ej.patron === "apoyos"){
    const o = (ej.pose && ej.pose.base) || {};
    L.push({id:"manosCm", et:"Altura del apoyo de las manos", u:"cm",
            min:0, max:110, paso:5, def:cm(o.hManos||0),
            ayuda:"Subir las manos a un banco o una barra reparte el peso hacia los pies."});
    if(!o.rodillas)
      L.push({id:"piesCm", et:"Altura del apoyo de los pies", u:"cm",
              min:0, max:80, paso:5, def:cm(o.hPies||0),
              ayuda:"Los pies en alto corren el peso hacia las manos."});
    L.push({id:"apertura", et:"Apertura de los codos", u:"°",
            min:0, max:80, paso:5, def: ej.apertura != null ? ej.apertura : 45,
            ayuda:"Codos pegados al cuerpo cargan el tríceps; muy abiertos, el pectoral."});
  }
  if(ej.patron === "brazos")
    L.push({id:"agarre", et:"Ancho del agarre", u:"cm", min:-8, max:14, paso:2, def:0,
            ayuda:"Más ancho aleja la carga del hombro; más cerrado se la pasa al codo."});
  if(ej.patron === "rotacion")
    L.push({id:"inclinacion", et:"Inclinación del apoyo", u:"°",
            min:-40, max:70, paso:5, def: ej.offset || 0,
            ayuda:"Es lo que separa un curl de pie de uno en banca Scott: mueve el punto duro."});
  if(ej.patron === "prensa"){
    L.push({id:"pie", et:"Pie en la plataforma", u:"cm", min:-12, max:12, paso:1, def:0,
            ayuda:"Arriba reparte a la cadera; abajo, a la rodilla."});
    L.push({id:"riel", et:"Inclinación de la máquina", u:"°",
            min:30, max:65, paso:5, def: ej.riel || 45,
            ayuda:"Cada prensa tiene la suya, y cambia cuánta fuerza llega al pie."});
  }
  if(ej.patron === "piernas")
    L.push(ej.anclaCarga
      ? {id:"barra", et:"Separación de la barra", u:"cm", min:0, max:20, paso:1, def:0,
         ayuda:"Cada centímetro que la barra se aleja de la pierna se suma al brazo de palanca."}
      : {id:"barra", et:"Posición de la carga", u:"cm", min:-8, max:16, paso:1, def:0,
         ayuda:"Adelante obliga a ir más erguido y carga la rodilla; atrás inclina el torso y carga la cadera."});
  return L;
}
const conDefectos = (ej, cuerpo, op) => {
  const o = Object.assign({}, op);
  for(const a of ajustesDe(ej, cuerpo)) if(o[a.id] == null) o[a.id] = a.def;
  return o;
};

/* ============================================================
   5. LAS MÉTRICAS DE CADA ARTICULACIÓN
   Para poder tocar una y que diga lo suyo: cuánto gira, cuánto torque
   aguanta, con qué brazo de palanca y qué músculo lo produce. Las que
   el modelo no calcula también aparecen, diciendo que no las calcula —
   es más honesto que esconderlas.
   ============================================================ */

function metricasDe(r, i, ej){
  const p = r.puntos[i];
  if(!p) return [];
  const g = p.geo || {};
  const L = [];
  const mete = (clave, nombre, musc, torque, extra) =>
    L.push(Object.assign({clave, nombre, musc, torque}, extra || {}));

  if(ej.patron === "piernas"){
    const cad = ej.principal === "cadera";
    mete(cad ? "cadera" : "rodilla", r.art, r.musc, p.torque,
         {angulo: p.angRodilla != null && !cad ? p.angRodilla : null, brazo: p.brazo});
    mete(cad ? "rodilla" : "cadera", r.art2, r.musc2, p.torque2,
         {angulo: cad ? p.angRodilla : null});
    mete("tobillo", "Tobillo", "Gemelo y sóleo", p.torque3);
  }else if(ej.patron === "prensa"){
    mete("rodilla", r.art, r.musc, p.torque, {angulo: p.ang, brazo: p.brazo});
    mete("cadera", r.art2, r.musc2, p.torque2, {brazo: p.h});
  }else if(ej.patron === "brazos"){
    mete("hombro", r.art, r.musc, p.torque, {brazo: p.brazo});
    mete("codo", r.art2, r.musc2, p.torque2, {angulo: p.ang});
  }else if(ej.patron === "apoyos"){
    mete((ej.momentoEn && ej.momentoEn[0]) || "codo", r.art, r.musc, p.torque,
         {angulo: p.ang, brazo: p.brazo});
    if(p.torque2 != null) mete((ej.momentoEn && ej.momentoEn[1]) || "hombro",
         r.art2, r.musc2, p.torque2);
    if(p.efectivo != null) L.push({clave:"manos", nombre:"Apoyo de las manos",
      musc:"", porcentaje: p.efectivo});
  }else if(ej.patron === "rotacion"){
    mete("pivote", r.art, r.musc, p.torque, {angulo: p.ang, brazo: p.brazo});
  }
  return L.filter(x => x.torque != null || x.porcentaje != null);
}

function calcular(ej, cuerpo, carga, opciones){
  if(!ej || !MOTORES[ej.patron]) return null;
  const op = conDefectos(ej, cuerpo, opciones);
  const r = MOTORES[ej.patron](ej, cuerpo, carga||0, op);
  r.ajustes = ajustesDe(ej, cuerpo);
  r.plano = ej.plano || "sagital";
  r.ej = ej;
  r.op = op;
  /* Cuánta fuerza llega de verdad al implemento. En una prensa de 45° no
     es el peso de los discos: es su componente a lo largo del riel. */
  if(r.fuerza == null)
    r.fuerza = ej.patron === "prensa"
      ? (carga||0)*G*sin(op.riel || ej.riel || 45)
      : (carga||0)*G;
  r.pico  = r.puntos.reduce((a,b)=> b.torque  > a.torque  ? b : a);
  r.pico2 = r.puntos.some(x=>x.torque2 != null)
    ? r.puntos.reduce((a,b)=> (b.torque2||0) > (a.torque2||0) ? b : a) : null;
  return r;
}

global.COACH_ALE_BIOMECANICA = {
  cuerpoDe, calcular, ajustesDe, metricasDe, torqueDe, comDe, kilos, sin, cos,
  LARGO, MASA, COM, G, RAD
};
})(window);
