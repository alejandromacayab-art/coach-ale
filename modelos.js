/* Qué modelo le toca a cada ejercicio
   -----------------------------------
   Cada entrada dice con qué mecánica se calcula el ejercicio y con qué
   parámetros. Los que no se calculan llevan `porque`: una explicación de
   qué decide ahí la dificultad, que en varios casos no son las palancas.
   Preferimos decirlo a inventar un número que suene bien. */

(function(global){
"use strict";
const B = global.COACH_ALE_BIOMECANICA;
const {sin, cos, kilos, comDe} = B;

/* Cinemática inversa de dos barras: el codo (o la rodilla) que cierra el
   triángulo entre dos puntos, al lado que se le pida. */
function articular(A, C, r1, r2, lado){
  const dx = C.x-A.x, dy = C.y-A.y;
  const D = Math.hypot(dx, dy) || 1e-6;
  const u = {x:dx/D, y:dy/D}, n = {x:-u.y*lado, y:u.x*lado};
  const a = (D*D + r1*r1 - r2*r2)/(2*D);
  const h = Math.sqrt(Math.max(0, r1*r1 - a*a));
  return {x:A.x + u.x*a + n.x*h, y:A.y + u.y*a + n.y*h};
}
const entre = (p,q,t)=>({x:p.x+(q.x-p.x)*t, y:p.y+(q.y-p.y)*t});

/* ---------- POSE DE EMPUJE ----------
   Hombro en el origen, la carga sube por una vertical que está a `xb` del
   hombro. Vale igual tumbado que de pie: lo que importa es que el peso cae
   hacia abajo y el brazo lo empuja hacia arriba. `xb` se cierra conforme
   se estira el codo, que es lo que hace de verdad la barra.           */
function posePresion(xb0, xb1){
  return (ang, L)=>{
    const Lb = L.brazo, Lam = L.antebrazoMano;
    const D = Math.sqrt(Lb*Lb + Lam*Lam - 2*Lb*Lam*cos(ang));
    const t = Math.max(0, Math.min(1, (ang-45)/(175-45)));
    const xb = xb0 + (xb1-xb0)*t;
    const y = Math.sqrt(Math.max(1e-4, D*D - xb*xb));
    const hombro = {x:0, y:0}, mano = {x:xb, y};
    return {hombro, mano, codo: articular(hombro, mano, Lb, Lam, -1)};
  };
}

/* ---------- POSE DE CUERPO APOYADO ----------
   El cuerpo es una tabla entre los pies y las manos. `hManos` y `hPies`
   son las alturas de los dos apoyos: subir uno u otro es toda la
   diferencia entre una flexión inclinada y una declinada.              */
function poseApoyo(opt){
  return (ang, cuerpo)=>{
    const {L, m} = cuerpo;
    const Lb = L.brazo, Lam = L.antebrazoMano;
    const D = Math.sqrt(Lb*Lb + Lam*Lam - 2*Lb*Lam*cos(ang));
    const hManos = (opt.hManos||0)*cuerpo.H, hPies = (opt.hPies||0)*cuerpo.H;
    const arriba = opt.debajo ? -1 : 1;     // ¿el cuerpo va sobre las manos o colgando?

    /* El hombro se queda encima de la mano y lo que sube y baja es él:
       eso es una flexión. De ahí sale el codo cerrando el triángulo, y
       es el codo el que se va para atrás cuando bajas — que es justo de
       donde sale el trabajo del tríceps. */
    const atras = (opt.atras != null ? opt.atras : 0.05);
    const dx = Math.min(atras, D*0.9);
    const manos  = {x:0, y:hManos};
    const hombro = {x:-dx, y:hManos + arriba*Math.sqrt(Math.max(1e-4, D*D - dx*dx))};
    const codo   = articular(hombro, manos, Lb, Lam, (opt.codoLado || -1)*arriba);

    /* La tabla del cuerpo: del hombro a la punta del pie. */
    const hastaRodilla = opt.rodillas === true;
    const Lc = L.tronco + L.muslo + (hastaRodilla ? 0 : L.pierna + L.pie*0.7);
    const dy = Math.max(-Lc*0.99, Math.min(Lc*0.99, hombro.y - hPies));
    const inc = Math.asin(dy/Lc)/B.RAD;
    const pies = {x: hombro.x - Lc*cos(inc), y: hPies};

    const cadera  = entre(hombro, pies, L.tronco/Lc);
    const rodilla = entre(hombro, pies, (L.tronco + L.muslo)/Lc);

    const pesos = [
      {kg:m.torso,  ...entre(hombro, cadera, L.comTorso/L.tronco)},
      {kg:m.muslo*2, ...entre(cadera, rodilla, 0.43)},
      {kg:m.brazo*2, ...entre(hombro, codo, 0.44)},
      {kg:m.antebrazoMano*2, ...entre(codo, manos, 0.44)}
    ];
    if(!hastaRodilla) pesos.push({kg:(m.pierna+m.pie)*2, ...entre(rodilla, pies, 0.45)});
    else pesos.push({kg:(m.pierna+m.pie)*2, x:pies.x + L.pierna*0.3, y:hPies});

    /* Qué queda entre las manos y cada articulación: lo que hay que
       descontar al cortar ahí. Decirlo explícito evita que el cálculo lo
       adivine por la posición, que es lo que fallaba en los fondos en
       banco y el remo invertido, donde el cuerpo queda del mismo lado
       que las manos. */
    const distales = {
      codo:   [pesos[3]],
      hombro: [pesos[3], pesos[2]],
      cadera: [pesos[3], pesos[2], pesos[0]]
    };
    return {manos, hombro, codo, cadera, rodilla, pies, inc, pesos, distales};
  };
}

/* ---------- POSE DE COLGADO ----------
   Fondos y dominadas: las manos están fijas y el que se mueve es el
   cuerpo. La fuerza de apoyo es el peso del cuerpo menos los brazos.  */
function poseColgado(opt){
  return (ang, cuerpo)=>{
    const {L, m} = cuerpo;
    const Lb = L.brazo, Lam = L.antebrazoMano;
    const D = Math.sqrt(Lb*Lb + Lam*Lam - 2*Lb*Lam*cos(ang));
    const manos = {x:0, y:0};
    const beta = opt.inclinacion || 8;
    const hombro = {x: (opt.adelante||0)*cuerpo.H, y: -D*cos(beta)};
    const codo = articular(hombro, manos, Lb, Lam, opt.codoLado || 1);
    const pesos = [
      {kg:cuerpo.M - 2*m.brazoEntero, x:hombro.x + (opt.comCuerpo||0)*cuerpo.H,
       y:hombro.y - L.tronco*0.5},
      {kg:m.brazo*2, ...entre(hombro, codo, 0.44)},
      {kg:m.antebrazoMano*2, ...entre(codo, manos, 0.44)}
    ];
    return {manos, hombro, codo, pies:{x:hombro.x, y:hombro.y}, inc:90, pesos,
            colgado:true};
  };
}

global.COACH_ALE_POSES = {posePresion, poseApoyo, poseColgado, articular, entre};

/* ============================================================
   EL MAPA: qué modelo le toca a cada ejercicio
   ============================================================ */

const pres = posePresion;

/* Atajos para no repetir los largos y las masas en cada entrada. */
const BRAZO   = {largo:L=>L.brazoEntero,   com:L=>L.comBrazoEntero,   masa:m=>m.brazoEntero};
const ANTEBR  = {largo:L=>L.antebrazoMano, com:L=>L.comAntebrazoMano, masa:m=>m.antebrazoMano};
const PIERNAB = {largo:L=>L.pierna,        com:L=>L.pierna*0.57,      masa:m=>m.pierna+m.pie};
const PIERNAE = {largo:L=>L.piernaEntera,  com:L=>L.comPiernaEntera,  masa:m=>m.piernaEntera};
const TORSO   = {largo:L=>L.tronco,        com:L=>L.comTorso,         masa:m=>m.torso};

const MODELOS = {

/* ---------------- PECHO ---------------- */
"Press banca": {patron:"brazos", pose:pres(0.19,0.06), rango:[50,175], lados:2, carga:60,
  art:"Hombro", musc:"Pectoral mayor", art2:"Codo", musc2:"Tríceps",
  ejeX:"Ángulo del codo",
  nota:"El brazo de palanca del hombro casi no cambia en todo el recorrido: lo que cambia de verdad es el del codo, que abajo es grande y arriba se va a cero. Por eso el bloqueo final es tríceps y el punto duro de abajo no se explica con palancas sino con la longitud del pectoral."},
"Press banca con mancuernas": {patron:"brazos", pose:pres(0.22,0.07), rango:[50,175], lados:2, carga:48,
  art:"Hombro", musc:"Pectoral mayor", art2:"Codo", musc2:"Tríceps", ejeX:"Ángulo del codo",
  nota:"Las mancuernas dejan bajar más y abrir más, así que el brazo de palanca del hombro abajo es mayor que con barra. Ese es el motivo real de que con mancuernas levantes menos kilos."},
"Press inclinado con barra": {patron:"brazos", pose:pres(0.21,0.07), rango:[50,175], lados:2, carga:45,
  art:"Hombro", musc:"Pectoral superior y deltoides anterior", art2:"Codo", musc2:"Tríceps", ejeX:"Ángulo del codo",
  nota:"Al inclinar el banco la barra queda más lejos del hombro en la horizontal: sube el torque de hombro y baja el de codo respecto al banco plano."},
"Press inclinado con mancuernas": {patron:"brazos", pose:pres(0.23,0.08), rango:[50,175], lados:2, carga:36,
  art:"Hombro", musc:"Pectoral superior y deltoides anterior", art2:"Codo", musc2:"Tríceps", ejeX:"Ángulo del codo"},
"Press declinado con barra": {patron:"brazos", pose:pres(0.16,0.05), rango:[50,175], lados:2, carga:60,
  art:"Hombro", musc:"Pectoral inferior", art2:"Codo", musc2:"Tríceps", ejeX:"Ángulo del codo",
  nota:"Declinado la barra queda más cerca de la vertical del hombro, el brazo de palanca baja y por eso suelen moverse más kilos que en plano."},
"Aperturas con mancuernas": {patron:"rotacion", ...BRAZO, rango:[0,80], lados:2, carga:16,
  art:"Hombro", musc:"Pectoral mayor", ejeX:"Apertura desde la vertical",
  nota:"Aquí el brazo de palanca es el brazo entero, no el antebrazo: por eso con 8 kilos por mano ya se siente más que un press con el triple. Lo más duro es abajo, estirado."},
"Aperturas en polea": {patron:"rotacion", ...BRAZO, rango:[10,85], lados:2, carga:14,
  art:"Hombro", musc:"Pectoral mayor", ejeX:"Apertura",
  nota:"La polea mantiene tensión también arriba, donde la mancuerna ya no pesa nada. El número de abajo asume que el cable tira horizontal: si la polea está muy alta o muy baja, el brazo real cambia."},
"Aperturas en máquina (pec deck)": {descrito:true, art:"Hombro", musc:"Pectoral mayor",
  porque:"La curva de resistencia la decide la leva de la máquina, que es una pieza del fabricante y desde fuera no se puede saber. Dos pec deck con el mismo número en la placa pueden pedir cosas distintas en el mismo punto del recorrido."},
"Fondos en paralelas": {patron:"brazos", pose:pres(0.13,0.04), rango:[55,175], lados:2, carga:0, corporal:0.88,
  art:"Hombro", musc:"Pectoral inferior y deltoides anterior", art2:"Codo", musc2:"Tríceps", ejeX:"Ángulo del codo",
  nota:"La carga es tu propio cuerpo menos los brazos, y no se puede bajar: por eso los fondos son un ejercicio avanzado aunque parezcan simples."},
"Flexiones de brazos": {patron:"apoyos", apertura:45, pose:poseApoyo({hManos:0, hPies:0}), rango:[90,172], carga:0,
  art:"Codo", musc:"Tríceps", ejeX:"Ángulo del codo"},
"Flexiones inclinadas": {patron:"apoyos", apertura:45, pose:poseApoyo({hManos:0.38, hPies:0}), rango:[90,172], carga:0,
  art:"Codo", musc:"Tríceps", ejeX:"Ángulo del codo",
  nota:"Manos en alto: el centro de masa se corre hacia los pies y a las manos llega menos peso. No es que seas más fuerte, es que la palanca te ayuda."},
"Flexiones declinadas": {patron:"apoyos", apertura:45, pose:poseApoyo({hManos:0, hPies:0.26}), rango:[90,172], carga:0,
  art:"Codo", musc:"Tríceps", ejeX:"Ángulo del codo",
  nota:"Pies en alto: el centro de masa se corre hacia las manos y llega más peso. Mismo cuerpo, más carga."},
"Press de pecho en máquina": {descrito:true, art:"Hombro", musc:"Pectoral mayor",
  porque:"La máquina fija el recorrido y la leva fija la resistencia. Lo que sí vale: al no tener que estabilizar, puedes llegar más cerca del fallo con menos riesgo, y por eso sirve bien como último ejercicio del día."},
"Pullover con mancuerna": {patron:"rotacion", ...BRAZO, rango:[0,95], lados:2, carga:20,
  art:"Hombro", musc:"Dorsal ancho y pectoral", ejeX:"Ángulo del brazo desde la vertical",
  nota:"El brazo de palanca es casi todo el brazo. Con el brazo horizontal, detrás de la cabeza, es donde más pesa — y también donde el hombro está más expuesto: no busques rango de más."},

/* ---------------- HOMBROS ---------------- */
"Press militar de pie": {patron:"brazos", pose:pres(0.16,0.01), rango:[55,175], lados:2, carga:35,
  art:"Hombro", musc:"Deltoides anterior", art2:"Codo", musc2:"Tríceps", ejeX:"Ángulo del codo",
  nota:"El punto duro está justo al salir de los hombros, donde la barra todavía está por delante. Cuando la barra llega encima de la cabeza el brazo de palanca se va casi a cero: por eso arriba se puede sostener mucho más de lo que se puede empujar."},
"Press hombro con mancuernas": {patron:"brazos", pose:pres(0.18,0.03), rango:[55,175], lados:2, carga:28,
  art:"Hombro", musc:"Deltoides anterior", art2:"Codo", musc2:"Tríceps", ejeX:"Ángulo del codo"},
"Press Arnold": {patron:"brazos", pose:pres(0.19,0.03), rango:[55,175], lados:2, carga:22,
  art:"Hombro", musc:"Deltoides anterior y medio", art2:"Codo", musc2:"Tríceps", ejeX:"Ángulo del codo",
  nota:"La rotación de la muñeca no cambia el torque: cambia qué parte del deltoides llega al ejercicio más estirada. El cálculo de abajo es el del press; la rotación va aparte."},
"Elevaciones laterales": {patron:"rotacion", ...BRAZO, rango:[0,95], lados:2, carga:14,
  art:"Hombro", musc:"Deltoides medio", ejeX:"Abducción del brazo",
  nota:"Palanca larga, peso chico. A 90° el brazo de palanca es el brazo entero, y por eso ocho kilos por mano ya es mucho. Subir más arriba de la horizontal no agrega torque: lo quita."},
"Elevaciones laterales en polea": {patron:"rotacion", ...BRAZO, rango:[0,95], lados:1, carga:8,
  art:"Hombro", musc:"Deltoides medio", ejeX:"Abducción del brazo",
  nota:"Con la polea abajo y el cuerpo al lado, la tensión no desaparece en la parte baja como con la mancuerna. El cálculo supone que el cable tira casi vertical."},
"Elevaciones frontales": {patron:"rotacion", ...BRAZO, rango:[0,95], lados:2, carga:12,
  art:"Hombro", musc:"Deltoides anterior", ejeX:"Flexión del brazo"},
"Elevaciones posteriores (pájaros)": {patron:"rotacion", ...BRAZO, rango:[0,85], lados:2, carga:10,
  art:"Hombro", musc:"Deltoides posterior", ejeX:"Apertura con el torso horizontal",
  nota:"Solo funciona con el torso cerca de la horizontal: si te enderezas, el brazo de palanca se va y el ejercicio se convierte en un encogimiento."},
"Encogimientos de hombros": {descrito:true, art:"Escápula", musc:"Trapecio superior",
  porque:"El recorrido es de pocos centímetros y la escápula no gira alrededor de un eje fijo, así que no hay un brazo de palanca que calcular. Lo que manda es el rango: subir del todo y bajar del todo, sin rebotar."},
"Flexiones pica": {patron:"apoyos", apertura:30, pose:poseApoyo({hManos:0, hPies:0, atras:-0.02}), rango:[90,172], carga:0,
  art:"Codo", musc:"Tríceps", ejeX:"Ángulo del codo",
  nota:"Con la cadera arriba el cuerpo queda casi vertical sobre las manos: es lo más cerca de un press de hombros que se puede hacer sin peso."},
"Elevaciones laterales con banda": {descrito:true, art:"Hombro", musc:"Deltoides medio",
  porque:"La banda no pesa: tira según cuánto la estires. La resistencia es casi cero al empezar y máxima al final, justo al revés que una mancuerna. Por eso con banda el ejercicio se siente más arriba del recorrido y no se puede comparar en kilos."},
"Press de hombro en máquina": {descrito:true, art:"Hombro", musc:"Deltoides anterior",
  porque:"La leva decide la curva. Lo que sí se puede decir: el recorrido guiado quita el trabajo de estabilizar, así que llegas más lejos con el deltoides y menos con el resto del cuerpo."},

/* ---------------- BÍCEPS ---------------- */
"Curl con barra": {patron:"rotacion", ...ANTEBR, rango:[0,145], lados:2, carga:30, offset:0,
  art:"Codo", musc:"Bíceps braquial", ejeX:"Flexión del codo",
  nota:"Lo más duro está exactamente a 90°, con el antebrazo horizontal. Arriba del todo el brazo de palanca vuelve a caer: por eso la última parte del recorrido se siente fácil y no es que estés haciendo trampa."},
"Curl con mancuernas": {patron:"rotacion", ...ANTEBR, rango:[0,145], lados:2, carga:24, offset:0,
  art:"Codo", musc:"Bíceps braquial", ejeX:"Flexión del codo"},
"Curl martillo": {patron:"rotacion", ...ANTEBR, rango:[0,145], lados:2, carga:26, offset:0,
  art:"Codo", musc:"Braquial y braquiorradial", ejeX:"Flexión del codo",
  nota:"La mecánica es idéntica a la del curl normal: lo que cambia es el agarre, y con él qué músculo del grupo queda en mejor posición. El torque es el mismo."},
"Curl predicador (banca Scott)": {patron:"rotacion", ...ANTEBR, rango:[0,135], lados:2, carga:22, offset:45,
  art:"Codo", musc:"Bíceps braquial", ejeX:"Flexión del codo",
  nota:"El atril inclina el brazo, así que el ejercicio ya arranca con palanca: lo más duro está abajo, con el codo casi estirado. Es el mismo movimiento que el curl de pie con la curva dada vuelta."},
"Curl inclinado": {patron:"rotacion", ...ANTEBR, rango:[0,140], lados:2, carga:18, offset:-25,
  art:"Codo", musc:"Bíceps braquial", ejeX:"Flexión del codo",
  nota:"En banco inclinado el brazo queda por detrás del cuerpo: el bíceps empieza más estirado y el pico de torque se corre más arriba del recorrido."},
"Curl en polea": {patron:"rotacion", ...ANTEBR, rango:[0,140], lados:2, carga:25, offset:0,
  art:"Codo", musc:"Bíceps braquial", ejeX:"Flexión del codo"},
"Curl con banda elástica": {descrito:true, art:"Codo", musc:"Bíceps braquial",
  porque:"La banda da su máxima tensión arriba, donde el brazo de palanca ya está cayendo. Las dos curvas se compensan y el ejercicio queda más parejo que con mancuerna — esa es su gracia, no la carga."},
"Curl concentrado": {patron:"rotacion", ...ANTEBR, rango:[0,135], lados:1, carga:12, offset:50,
  art:"Codo", musc:"Bíceps braquial", ejeX:"Flexión del codo",
  nota:"Con el codo apoyado en el muslo el brazo queda inclinado: igual que en la banca Scott, lo duro está abajo."},

/* ---------------- TRÍCEPS ---------------- */
"Extensión de tríceps en polea": {patron:"rotacion", ...ANTEBR, rango:[0,120], lados:2, carga:25, offset:0,
  art:"Codo", musc:"Tríceps braquial", ejeX:"Extensión del codo",
  nota:"El cálculo supone que el cable tira vertical hacia arriba, que es lo que pasa cuando los codos quedan pegados al cuerpo. Si los separas, el brazo de palanca cambia y el ejercicio deja de ser el mismo."},
"Extensión de tríceps sobre la cabeza": {patron:"rotacion", ...ANTEBR, rango:[0,125], lados:2, carga:20, offset:0,
  art:"Codo", musc:"Tríceps braquial (cabeza larga)", ejeX:"Flexión del codo",
  nota:"Con el brazo arriba la cabeza larga del tríceps queda estirada, que es lo que diferencia esta versión de la de polea con los codos abajo."},
"Press francés": {patron:"rotacion", ...ANTEBR, rango:[0,120], lados:2, carga:25, offset:0,
  art:"Codo", musc:"Tríceps braquial", ejeX:"Flexión del codo",
  nota:"Lo más duro, con el antebrazo horizontal, cae justo donde el codo está más expuesto. Si duele el codo, baja el peso antes que el rango."},
"Fondos en banco": {patron:"apoyos", apertura:12, pose:poseApoyo({hManos:0.26, hPies:0, atras:-0.09}), rango:[90,172], carga:0,
  art:"Codo", musc:"Tríceps braquial", ejeX:"Ángulo del codo",
  nota:"Cuanto más lejos pongas los pies, más peso llega a las manos. Es la misma palanca que en las flexiones, al revés."},
"Patada de tríceps": {patron:"rotacion", ...ANTEBR, rango:[0,90], lados:1, carga:8, offset:0,
  art:"Codo", musc:"Tríceps braquial", ejeX:"Extensión del codo",
  nota:"Con el brazo horizontal el máximo está arriba del todo, con el codo estirado. Es el único ejercicio de tríceps donde el punto duro coincide con el bloqueo."},
"Press banca agarre cerrado": {patron:"brazos", pose:pres(0.11,0.04), rango:[50,175], lados:2, carga:50,
  art:"Codo", musc:"Tríceps braquial", ejeX:"Ángulo del codo",
  nota:"Cerrar el agarre acerca la barra a la vertical del hombro y aleja el codo: baja el torque de hombro y sube el de codo. Eso es todo lo que hace el agarre cerrado."},
"Flexiones diamante": {patron:"apoyos", apertura:16, pose:poseApoyo({hManos:0, hPies:0, atras:0.03}), rango:[90,172], carga:0,
  art:"Codo", musc:"Tríceps braquial", ejeX:"Ángulo del codo"},
"Extensión de tríceps con banda": {descrito:true, art:"Codo", musc:"Tríceps braquial",
  porque:"La tensión de la banda sube con el estiramiento, así que el máximo cae con el codo estirado. Combina bien con el press francés, que es duro justo en el otro extremo."},

/* ---------------- ESPALDA ---------------- */
"Dominadas": {descrito:true, art:"Hombro y codo", musc:"Dorsal ancho y bíceps",
  porque:"Las manos están fijas y el que se mueve es el cuerpo, así que la distancia entre el hombro y la barra casi no cambia: no hay una palanca externa que explique la dificultad. Lo que la explica es que la carga es tu peso entero y no se puede bajar. La única variable real es cuánto peso cuelga de ti: por eso se progresa con lastre o con goma, no cambiando la técnica."},
"Dominadas supinas": {descrito:true, art:"Hombro y codo", musc:"Dorsal ancho y bíceps",
  porque:"Mismo caso que las dominadas pronas. El agarre supino no cambia el torque: pone al bíceps en mejor posición para ayudar, y por eso casi todo el mundo hace más repeticiones."},
"Jalón al pecho": {descrito:true, art:"Hombro", musc:"Dorsal ancho",
  porque:"El cable tira en línea recta hacia arriba y el hombro gira debajo: el brazo de palanca lo fija la máquina y la polea, no tu postura. La variable que sí controlas es dónde terminas el tirón — al pecho, con los codos hacia abajo y atrás."},
"Jalón agarre neutro": {descrito:true, art:"Hombro", musc:"Dorsal ancho",
  porque:"Igual que el jalón al pecho. El agarre neutro suele permitir llevar el codo más atrás, que es donde el dorsal termina de acortarse."},
"Remo con barra": {patron:"piernas", eje:"tronco", principal:"cadera", anclaCarga:true, rango:[20,80], carga:60,
  rodilla: t => 160,
  cargaPos:(h,c,L)=>({x:h.x, y:h.y - L.brazoEntero}),
  art:"Cadera y zona lumbar", musc:"Erectores y glúteo", art2:"Rodilla", musc2:"Cuádriceps", ejeX:"Inclinación del torso",
  nota:"El número grande de este ejercicio no está en la espalda alta: está en la zona lumbar, que tiene que sostener el torso y la barra en voladizo. Por eso un remo pesado cansa la espalda baja antes que el dorsal."},
"Remo con mancuerna a una mano": {descrito:true, art:"Hombro", musc:"Dorsal ancho",
  porque:"Al apoyar una mano y una rodilla en el banco, el torso deja de estar en voladizo: la carga lumbar se reparte entre los dos apoyos y baja mucho respecto al remo con barra. Esa es toda su ventaja — permite cargar el dorsal sin cargar la espalda baja."},
"Remo en polea sentado": {descrito:true, art:"Hombro", musc:"Dorsal ancho y romboides",
  porque:"Sentado y con el torso vertical no hay voladizo: la espalda baja no entra. El cable fija la dirección, así que el brazo de palanca no depende de ti. Lo que sí depende: no balancear el torso para sumar kilos."},
"Remo en máquina": {descrito:true, art:"Hombro", musc:"Dorsal ancho",
  porque:"La leva decide la curva y el pecho apoyado quita el voladizo. Es la versión del remo con la menor carga lumbar de todas."},
"Remo en barra T": {patron:"piernas", eje:"tronco", principal:"cadera", anclaCarga:true, rango:[25,70], carga:50,
  rodilla: t => 160,
  cargaPos:(h,c,L)=>({x:h.x - 0.05, y:h.y - L.brazoEntero}),
  art:"Cadera y zona lumbar", musc:"Erectores y glúteo", art2:"Rodilla", musc2:"Cuádriceps", ejeX:"Inclinación del torso",
  nota:"Con el pecho apoyado la carga lumbar desaparece casi entera; sin apoyo es un remo con barra con otro nombre. El cálculo es el de la versión sin apoyo."},
"Face pull": {descrito:true, art:"Hombro", musc:"Deltoides posterior y rotadores",
  porque:"Es rotación externa del hombro con el brazo en alto: el movimiento no está en el plano del dibujo y el brazo de palanca lo fija la polea. Va con poco peso y mucho control; si tienes que tirar con el torso, sobra peso."},
"Pullover en polea": {patron:"rotacion", largo:L=>L.brazoEntero, com:L=>L.comBrazoEntero,
  masa:m=>m.brazoEntero, rango:[0,80], lados:2, carga:25, offset:10,
  art:"Hombro", musc:"Dorsal ancho", ejeX:"Ángulo del brazo",
  nota:"Es de los pocos ejercicios de dorsal donde el codo casi no trabaja: el brazo va estirado, así que todo el torque cae en el hombro."},
"Peso muerto": {patron:"piernas", eje:"tronco", principal:"cadera", anclaCarga:true, rango:[15,75], carga:100,
  rodilla: t => 180 - t*0.55,
  cargaPos:(h,c,L)=>({x:h.x, y:h.y - L.brazoEntero}),
  art:"Cadera y zona lumbar", musc:"Glúteo, isquios y erectores", art2:"Rodilla", musc2:"Cuádriceps", ejeX:"Inclinación del torso",
  nota:"El torque de cadera es el número más grande que vas a ver en toda la biblioteca, y crece con la inclinación del torso: por eso el peso muerto se rompe abajo y no arriba, y por eso la barra tiene que ir pegada a la pierna — cada centímetro que se separa se suma al brazo de palanca."},
"Remo invertido": {patron:"apoyos", apertura:35, pose:poseApoyo({hManos:0.42, hPies:0, debajo:true, atras:0.08}), rango:[90,170], carga:0,
  art:"Codo", musc:"Bíceps y dorsal", ejeX:"Ángulo del codo",
  nota:"Cuanto más horizontal te pongas, más peso llega a las manos. Es la dominada con el volumen regulable."},
"Remo con banda elástica": {descrito:true, art:"Hombro", musc:"Dorsal ancho",
  porque:"La banda da el máximo al final del tirón, justo donde el dorsal está más acortado y normalmente se pierde tensión. Por eso funciona bien como ejercicio de contracción, aunque en kilos no se pueda comparar con nada."},
"Superman": {patron:"rotacion", largo:L=>L.comTorso, com:L=>L.comTorso, masa:m=>m.torso*0.45,
  rango:[0,22], lados:1, carga:0,
  art:"Zona lumbar", musc:"Erectores de la columna", ejeX:"Elevación del torso",
  nota:"El rango real son unos veinte grados y el torque es chico: es un ejercicio de resistencia y de aprender a sostener, no de fuerza. Si buscas cargar los erectores de verdad, está el peso muerto."},
"Bird dog": {descrito:true, art:"Zona lumbar", musc:"Erectores y core",
  porque:"Lo que se entrena no es levantar el brazo y la pierna: es que la cadera y la columna no se muevan mientras se levantan. Eso es antirrotación, y la medida de si está bien hecho no es el torque sino que la pelvis quede quieta."},
"Hiperextensiones": {patron:"rotacion", largo:L=>L.tronco*0.72, com:L=>L.comTorso,
  masa:m=>m.torso, rango:[0,90], lados:1, carga:10,
  art:"Cadera y zona lumbar", musc:"Erectores, glúteo e isquios", ejeX:"Ángulo del torso desde la vertical",
  nota:"Lo más duro es arriba, con el torso horizontal, y ahí el peso de tu propio torso ya pone casi todo el torque: por eso un disco de diez kilos contra el pecho cambia tanto."},
"Buenos días": {patron:"piernas", eje:"tronco", principal:"cadera", rango:[15,80], carga:40,
  rodilla: t => 168,
  cargaPos:(h)=>({x:h.x, y:h.y}),
  art:"Cadera y zona lumbar", musc:"Isquios, glúteo y erectores", art2:"Rodilla", musc2:"Cuádriceps", ejeX:"Inclinación del torso",
  nota:"Con la barra en los hombros el brazo de palanca es el torso entero: con la mitad del peso de un peso muerto llegas al mismo torque de cadera. Es el ejercicio más fácil de pasarse de la biblioteca."},

/* ---------------- PIERNA ---------------- */
"Sentadilla": {patron:"piernas", rango:[60,170], carga:80,
  cargaPos:(h)=>({x:h.x, y:h.y}),
  art:"Rodilla", musc:"Cuádriceps", art2:"Cadera", musc2:"Glúteo e isquios",
  nota:"La postura no está puesta a mano: el modelo busca el ángulo de torso que deja tu centro de masa sobre el medio del pie, que es lo que hace tu cuerpo para no caerse. Por eso al bajar el torso se inclina solo, y con él sube el torque de cadera."},
"Sentadilla frontal": {patron:"piernas", rango:[60,170], carga:60,
  cargaPos:(h,c,L)=>({x:h.x + 0.10, y:h.y}),
  art:"Rodilla", musc:"Cuádriceps", art2:"Cadera", musc2:"Glúteo e isquios",
  nota:"La barra delante obliga a ir más erguido —si te inclinas, se cae— y eso corre el reparto hacia la rodilla. No es una creencia: sale del equilibrio."},
"Prensa de piernas": {patron:"prensa", rango:[70,165], carga:150, pieRegulable:true,
  art:"Rodilla", musc:"Cuádriceps", art2:"Cadera", musc2:"Glúteo y aductor",
  nota:"El único ejercicio donde puedes mover el reparto sin cambiar el peso: subir o bajar el pie en la plataforma."},
"Sentadilla hack": {patron:"prensa", rango:[70,165], carga:100, riel:50, pieRegulable:true,
  art:"Rodilla", musc:"Cuádriceps", art2:"Cadera", musc2:"Glúteo y aductor",
  nota:"La hack es una prensa con el torso apoyado y los rieles más verticales: el reparto se mueve igual con la altura del pie, pero la espalda no entra."},
"Zancadas con mancuernas": {patron:"piernas", rango:[70,170], carga:30, reparto:0.75,
  cargaPos:(h,c,L)=>({x:h.x, y:h.y - L.brazoEntero}),
  art:"Rodilla", musc:"Cuádriceps", art2:"Cadera", musc2:"Glúteo e isquios",
  nota:"A una pierna el reparto no es mitad y mitad: la de adelante se lleva alrededor de tres cuartos. Por eso con la mitad del peso de una sentadilla ya estás en el mismo torque."},
"Sentadilla búlgara": {patron:"piernas", rango:[70,170], carga:24, reparto:0.85,
  cargaPos:(h,c,L)=>({x:h.x, y:h.y - L.brazoEntero}),
  art:"Rodilla", musc:"Cuádriceps", art2:"Cadera", musc2:"Glúteo e isquios",
  nota:"Con el pie de atrás solo apoyado, casi todo el peso cae en la pierna de adelante. Es el ejercicio con mejor relación entre torque y kilos de toda la biblioteca."},
"Extensión de cuádriceps": {patron:"rotacion", largo:L=>L.pierna, com:L=>L.pierna*0.57,
  masa:m=>m.pierna+m.pie, rango:[0,90], lados:2, carga:40, offset:0,
  art:"Rodilla", musc:"Cuádriceps", ejeX:"Extensión de la rodilla",
  nota:"Lo más duro es arriba del todo, con la rodilla estirada — justo al revés que la sentadilla. Por eso los dos se complementan y no se reemplazan. Si la máquina tiene leva, la curva real puede estar corrida."},
"Curl femoral tumbado": {patron:"rotacion", largo:L=>L.pierna, com:L=>L.pierna*0.57,
  masa:m=>m.pierna+m.pie, rango:[0,100], lados:2, carga:35, offset:-90,
  art:"Rodilla", musc:"Isquiotibiales", ejeX:"Flexión de la rodilla",
  nota:"Lo más duro está al principio, con la pierna estirada, y se va cayendo a medida que flexionas. Por eso las últimas repeticiones se terminan arriba aunque abajo ya no puedas."},
"Peso muerto rumano": {patron:"piernas", eje:"tronco", principal:"cadera", anclaCarga:true, rango:[10,80], carga:70,
  rodilla: t => 165,
  cargaPos:(h,c,L)=>({x:h.x, y:h.y - L.brazoEntero}),
  art:"Cadera", musc:"Isquiotibiales y glúteo", art2:"Rodilla", musc2:"Cuádriceps", ejeX:"Inclinación del torso",
  nota:"La rodilla casi no se mueve: todo el recorrido es de cadera, y por eso el isquio se estira. El torque crece hasta que el torso llega a la horizontal — ahí es donde se decide el ejercicio y donde se pierde la espalda si redondeas."},
"Elevación de talones de pie": {patron:"rotacion", largo:L=>L.pie*0.55, com:L=>L.pie*0.3,
  masa:m=>0, rango:[70,105], lados:1, carga:40, corporal:0.92,
  art:"Tobillo", musc:"Gemelo y sóleo", ejeX:"Ángulo del tobillo",
  nota:"El brazo de palanca es casi plano en todo el recorrido: es de los pocos ejercicios con torque parejo de principio a fin. La carga incluye tu peso corporal, que aquí es la mayor parte."},
"Elevación de talones sentado": {patron:"rotacion", largo:L=>L.pie*0.55, com:L=>L.pie*0.3,
  masa:m=>0, rango:[70,105], lados:1, carga:60, corporal:0,
  art:"Tobillo", musc:"Sóleo", ejeX:"Ángulo del tobillo",
  nota:"Sentado, con la rodilla doblada, el gemelo queda acortado y se retira: el trabajo pasa al sóleo. Aquí tu peso corporal no cuenta, solo lo que pongas encima de la rodilla."},
"Sentadilla con peso corporal": {patron:"piernas", rango:[60,170], carga:0,
  cargaPos:(h)=>({x:h.x, y:h.y}),
  art:"Rodilla", musc:"Cuádriceps", art2:"Cadera", musc2:"Glúteo e isquios",
  nota:"Sin barra el torque sigue existiendo: lo pone tu propio torso. Mira el número abajo del todo antes de decidir que no cuenta como ejercicio."},
"Sentadilla goblet": {patron:"piernas", rango:[60,170], carga:24,
  cargaPos:(h,c,L)=>({x:h.x + 0.16, y:h.y - 0.10}),
  art:"Rodilla", musc:"Cuádriceps", art2:"Cadera", musc2:"Glúteo e isquios",
  nota:"La pesa por delante hace de contrapeso y te deja ir más erguido y más profundo. Es la razón de que sea la mejor sentadilla para aprender."},
"Zancadas sin peso": {patron:"piernas", rango:[70,170], carga:0, reparto:0.75,
  cargaPos:(h)=>({x:h.x, y:h.y}),
  art:"Rodilla", musc:"Cuádriceps", art2:"Cadera", musc2:"Glúteo e isquios"},
"Subida al cajón": {patron:"piernas", rango:[80,170], carga:0, reparto:0.95,
  cargaPos:(h)=>({x:h.x, y:h.y}),
  art:"Rodilla", musc:"Cuádriceps", art2:"Cadera", musc2:"Glúteo e isquios",
  nota:"Toda la subida la hace la pierna de arriba: si empujas con la de abajo el ejercicio deja de serlo. Por eso la altura del cajón importa más que cualquier peso que agregues."},
"Sentadilla isométrica en pared": {patron:"piernas", rango:[85,120], carga:0,
  tronco: () => 0,
  cargaPos:(h)=>({x:h.x, y:h.y}),
  art:"Rodilla", musc:"Cuádriceps", art2:"Cadera", musc2:"Glúteo e isquios",
  nota:"La pared mantiene el torso vertical, así que la cadera casi no trabaja y todo el torque se queda en la rodilla. Es cuádriceps puro, y por eso arde donde arde."},
"Peso muerto rumano con mancuernas": {patron:"piernas", eje:"tronco", principal:"cadera", anclaCarga:true, rango:[10,80], carga:40,
  rodilla: t => 165,
  cargaPos:(h,c,L)=>({x:h.x, y:h.y - L.brazoEntero}),
  art:"Cadera", musc:"Isquiotibiales y glúteo", art2:"Rodilla", musc2:"Cuádriceps", ejeX:"Inclinación del torso",
  nota:"Con mancuernas puedes bajar más que con barra porque no chocan con la pierna: más rango de isquio, con menos kilos para el mismo torque."},
"Curl femoral sentado": {patron:"rotacion", largo:L=>L.pierna, com:L=>L.pierna*0.57,
  masa:m=>m.pierna+m.pie, rango:[0,90], lados:2, carga:40, offset:-90,
  art:"Rodilla", musc:"Isquiotibiales", ejeX:"Flexión de la rodilla",
  nota:"Sentado, con la cadera flexionada, el isquio parte más estirado que tumbado — y los estudios de crecimiento tienden a favorecer esa versión. La curva de la máquina puede estar corrida por la leva."},
"Aductores en máquina": {descrito:true, art:"Cadera", musc:"Aductores",
  porque:"El movimiento es en el plano de frente, que no es el del dibujo, y la leva fija la resistencia. Lo que sí conviene saber: el aductor mayor también extiende la cadera, así que ya está trabajando en cada sentadilla y cada peso muerto."},
"Elevación de talones sin peso": {patron:"rotacion", largo:L=>L.pie*0.55, com:L=>L.pie*0.3,
  masa:m=>0, rango:[70,105], lados:1, carga:0, corporal:0.92,
  art:"Tobillo", musc:"Gemelo y sóleo", ejeX:"Ángulo del tobillo",
  nota:"Sin peso extra ya mueves más del noventa por ciento de tu cuerpo sobre la punta del pie. A una pierna, el doble."},

/* ---------------- GLÚTEO ---------------- */
"Hip thrust": {patron:"rotacion", lados:2, largo:L=>L.muslo, com:L=>L.muslo*0.5,
  masa:m=>m.torso*0.25, rango:[0,45], carga:80, offset:45,
  art:"Cadera", musc:"Glúteo mayor", ejeX:"Subida de la cadera",
  nota:"Lo más duro es arriba del todo, con el fémur horizontal — al revés que la sentadilla, que es más dura abajo. Por eso los dos juntos cubren el recorrido entero del glúteo."},
"Puente de glúteo": {patron:"rotacion", lados:2, largo:L=>L.muslo, com:L=>L.muslo*0.5,
  masa:m=>m.torso*0.25, rango:[0,40], carga:0, offset:50,
  art:"Cadera", musc:"Glúteo mayor", ejeX:"Subida de la cadera",
  nota:"La versión sin peso del hip thrust y con menos rango, porque los hombros están en el suelo. Sirve para aprender el movimiento; para cargarlo hace falta el banco."},
"Patada de glúteo en polea": {patron:"rotacion", largo:L=>L.piernaEntera*0.8, com:L=>L.comPiernaEntera,
  masa:m=>m.piernaEntera, rango:[0,45], lados:1, carga:15, offset:70,
  art:"Cadera", musc:"Glúteo mayor", ejeX:"Extensión de la cadera"},
"Abducción de cadera en máquina": {descrito:true, art:"Cadera", musc:"Glúteo medio",
  porque:"Plano de frente otra vez, y con leva. El glúteo medio trabaja sobre todo evitando que la rodilla se caiga adentro cuando estás a una pierna: la máquina lo aísla, pero el gesto que importa está en las zancadas y las subidas al cajón."},
"Peso muerto sumo": {patron:"piernas", eje:"tronco", principal:"cadera", anclaCarga:true, rango:[15,65], carga:100,
  rodilla: t => 175 - t*0.75,
  cargaPos:(h,c,L)=>({x:h.x, y:h.y - L.brazoEntero}),
  art:"Cadera", musc:"Glúteo, aductores y cuádriceps", art2:"Rodilla", musc2:"Cuádriceps", ejeX:"Inclinación del torso",
  nota:"La postura abierta deja el torso más vertical que en el convencional: menos brazo de palanca en la lumbar para el mismo peso. Ojo con el número de rodilla: el sumo abre las piernas hacia los lados y eso queda fuera del plano del dibujo, así que el modelo se queda corto con el cuádriceps y los aductores, que en la realidad trabajan más que en el convencional."},
"Hip thrust con mancuerna": {patron:"rotacion", lados:2, largo:L=>L.muslo, com:L=>L.muslo*0.5,
  masa:m=>m.torso*0.25, rango:[0,45], carga:30, offset:45,
  art:"Cadera", musc:"Glúteo mayor", ejeX:"Subida de la cadera"},
"Puente de glúteo a una pierna": {patron:"rotacion", largo:L=>L.muslo, com:L=>L.muslo*0.5,
  masa:m=>m.torso*0.5, rango:[0,40], lados:1, carga:0, offset:50,
  art:"Cadera", musc:"Glúteo mayor", ejeX:"Subida de la cadera",
  nota:"A una pierna el torque se duplica sin agregar un gramo: es la forma de progresar el puente cuando no tienes con qué cargarlo."},
"Patada de glúteo en cuadrupedia": {patron:"rotacion", largo:L=>L.piernaEntera*0.55, com:L=>L.comPiernaEntera*0.8,
  masa:m=>m.piernaEntera, rango:[0,60], lados:1, carga:0,
  art:"Cadera", musc:"Glúteo mayor", ejeX:"Extensión de la cadera",
  nota:"Con la rodilla doblada el brazo de palanca se acorta y el torque es bajo. Es un ejercicio de activación, no de carga: pedirle fuerza es pedirle lo que no tiene."},
"Caminata lateral con banda": {descrito:true, art:"Cadera", musc:"Glúteo medio",
  porque:"La resistencia depende de cuánto estires la banda en cada paso, y eso cambia con el ancho del paso. No hay un número honesto que dar. Lo que define si está bien hecho: que las rodillas no se junten y que el paso sea parejo."},

/* ---------------- CORE ---------------- */
"Plancha": {patron:"apoyos", pose:poseApoyo({hManos:0.105, hPies:0, atras:0.02}),
  rango:[86,94], carga:0, momentoEn:["cadera"], divisor:[1],
  art:"Zona lumbar", musc:"Recto abdominal y transverso", ejeX:"Postura",
  nota:"El torque que aguanta tu abdomen en una plancha es el que impide que la cadera se caiga al suelo. No depende de que aprietes: depende de la distancia entre los codos y los pies. Por eso una plancha bien alineada es dura y una con la cadera arriba es un descanso."},
"Plancha lateral": {descrito:true, art:"Zona lumbar", musc:"Oblicuos y cuadrado lumbar",
  porque:"El trabajo es en el plano de frente, que no es el del dibujo. La idea es la misma que en la plancha —impedir que la cadera se caiga— pero hacia el lado, y con la mitad de los apoyos: por eso se aguanta mucho menos tiempo."},
"Crunch en polea": {patron:"rotacion", largo:L=>L.tronco*0.8, com:L=>L.comTorso,
  masa:m=>m.torso*0.5, rango:[0,45], lados:1, carga:30, offset:10,
  art:"Columna", musc:"Recto abdominal", ejeX:"Flexión del tronco",
  nota:"El único ejercicio de abdomen de la biblioteca al que se le puede subir el peso de verdad. El recorrido es corto: es flexionar la columna, no doblarse por la cadera."},
"Elevación de piernas colgado en barra": {patron:"rotacion", largo:L=>L.comPiernaEntera,
  com:L=>L.comPiernaEntera, masa:m=>m.piernaEntera*2, rango:[0,90], lados:1, carga:0,
  art:"Cadera y columna", musc:"Recto abdominal y psoas", ejeX:"Elevación de las piernas",
  nota:"Tus dos piernas pesan alrededor de un tercio de ti y el brazo de palanca es largo: por eso con cero kilos el torque es mayor que el de muchos ejercicios con peso. Con las rodillas dobladas el brazo se acorta casi a la mitad — esa es la versión fácil."},
"Rueda abdominal": {descrito:true, art:"Zona lumbar", musc:"Recto abdominal",
  porque:"La carga depende de cuánto ruedes, y eso cambia a cada centímetro: no hay un punto del recorrido que represente al ejercicio. Lo que sí vale: estirado del todo, el brazo de palanca entre las manos y la cadera es casi tu cuerpo entero, y es el torque de antiextensión más alto que puedes generar sin equipamiento."},
"Pallof press": {descrito:true, art:"Columna", musc:"Oblicuos",
  porque:"Es antirrotación: el cable intenta girarte y tú no dejas. El torque depende de cuánto separes las manos del cuerpo, no del recorrido. Se mide en si consigues no moverte, y por eso se hace con poco peso."},
"Crunch abdominal": {patron:"rotacion", largo:L=>L.tronco*0.7, com:L=>L.comTorso,
  masa:m=>m.torso*0.5, rango:[0,35], lados:1, carga:0,
  art:"Columna", musc:"Recto abdominal", ejeX:"Flexión del tronco",
  nota:"Rango corto y torque bajo: el crunch sin peso se queda sin estímulo en pocas semanas. Cuando llegues ahí, el paso siguiente es el crunch en polea o colgarte de la barra."},
"Elevación de piernas tumbado": {patron:"rotacion", largo:L=>L.comPiernaEntera,
  com:L=>L.comPiernaEntera, masa:m=>m.piernaEntera*2, rango:[0,85], lados:1, carga:0, offset:-90,
  art:"Cadera y columna", musc:"Recto abdominal y psoas", ejeX:"Elevación de las piernas",
  nota:"Lo más duro es abajo, con las piernas casi en el suelo — justo donde la espalda baja se quiere despegar. Si se despega, no bajes tanto: ahí no estás entrenando el abdomen, lo estás saltando."},
"Bicicleta abdominal": {descrito:true, art:"Columna", musc:"Recto abdominal y oblicuos",
  porque:"Mezcla flexión y rotación alternando lados, así que no hay una postura que represente al ejercicio. Es trabajo de resistencia con poco torque: sirve para acumular repeticiones, no para cargar."},
"Dead bug": {descrito:true, art:"Zona lumbar", musc:"Recto abdominal y transverso",
  porque:"Como el bird dog: lo que se entrena es que la espalda baja no se despegue del suelo mientras se mueven brazo y pierna. La señal de que está bien hecho no es un número, es que la zona lumbar siga pegada."},
"Hollow hold": {patron:"rotacion", largo:L=>L.comTorso*0.9, com:L=>L.comTorso*0.9,
  masa:m=>m.piernaEntera*2 + m.torso*0.3, rango:[75,90], lados:1, carga:0,
  art:"Zona lumbar", musc:"Recto abdominal", ejeX:"Postura",
  nota:"Es la plancha dada vuelta: el torque lo pone el peso de tus piernas y tu torso en voladizo sobre la zona lumbar. Bajar las piernas lo hace más duro, doblarlas lo hace más fácil, y las dos cosas son palanca pura."}
};

global.COACH_ALE_MODELOS = MODELOS;
})(window);
