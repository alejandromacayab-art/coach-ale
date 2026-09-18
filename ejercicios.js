/* ============================================================
   Coach Ale · biblioteca de ejercicios
   ------------------------------------------------------------
   Cada ejercicio trae, además del grupo muscular:
     eq  el equipamiento que necesita
     s   dónde deberías sentirlo si lo haces bien
     e   los errores que más se repiten
   El dibujo del cuerpo se genera aquí mismo, en SVG: no son
   fotos de nadie, es un esquema que pinta el músculo objetivo.
   ============================================================ */
(function(global){
"use strict";

const EJERCICIOS = [
  /* ---------------- PECHO ---------------- */
  {n:"Press banca", g:"pecho", eq:"Barra",
   s:"En el pecho, sobre todo en la parte media y externa, al bajar y al empujar.",
   e:["Rebotar la barra en el pecho en vez de controlar la bajada.",
      "Despegar los omóplatos: pierdes base y cargas el hombro.",
      "Sacar los codos a 90°; llévalos a unos 45° del tronco."]},
  {n:"Press banca con mancuernas", g:"pecho", eq:"Mancuernas",
   s:"Estiramiento en el pecho abajo y contracción al juntar arriba.",
   e:["Chocar las mancuernas arriba y perder tensión.",
      "Bajar más de lo que tu hombro tolera.",
      "Girar las muñecas de forma brusca."]},
  {n:"Press inclinado con barra", g:"pecho", eq:"Barra",
   s:"En la parte alta del pecho, cerca de la clavícula.",
   e:["Inclinar el banco más de 45°: pasa a ser press de hombro.",
      "Bajar la barra al cuello en vez de a la parte alta del pecho."]},
  {n:"Press inclinado con mancuernas", g:"pecho", eq:"Mancuernas",
   s:"Parte alta del pecho, con estiramiento al bajar.",
   e:["Arquear la espalda hasta convertirlo en un press plano.",
      "Usar un peso que te obliga a lanzarlas con las piernas."]},
  {n:"Press declinado con barra", g:"pecho", eq:"Barra",
   s:"Parte baja del pecho.",
   e:["Bajar la barra demasiado alto.",
      "Soltar el agarre por la inclinación."]},
  {n:"Aperturas con mancuernas", g:"pecho", eq:"Mancuernas",
   s:"Estiramiento amplio en el pecho; nada en los codos.",
   e:["Doblar y estirar los codos: eso ya es un press.",
      "Bajar tanto que el hombro haga el trabajo."]},
  {n:"Aperturas en polea", g:"pecho", eq:"Polea",
   s:"Tensión continua en el pecho, también al cruzar las manos.",
   e:["Tirar con los brazos rígidos del todo.",
      "Adelantar el cuerpo y perder el pecho."]},
  {n:"Aperturas en máquina (pec deck)", g:"pecho", eq:"Máquina",
   s:"Contracción aislada en el centro del pecho.",
   e:["Encoger los hombros hacia las orejas.",
      "Soltar de golpe al volver."]},
  {n:"Fondos en paralelas", g:"pecho", eq:"Peso corporal",
   s:"Pecho bajo y tríceps; inclínate hacia delante para el pecho.",
   e:["Bajar más allá de lo que el hombro aguanta.",
      "Quedarte vertical si buscas pecho."]},
  {n:"Flexiones de brazos", g:"pecho", eq:"Peso corporal",
   s:"Pecho y tríceps, con el abdomen firme.",
   e:["Dejar caer la cadera.",
      "Abrir los codos en cruz.",
      "Recorrido corto: baja hasta rozar el suelo."]},

  /* ---------------- ESPALDA ---------------- */
  {n:"Dominadas", g:"espalda", eq:"Peso corporal",
   s:"Dorsal, desde la axila hasta el costado.",
   e:["Balancearte para subir.",
      "No estirar abajo y perder la mitad del recorrido.",
      "Tirar solo con los brazos: inicia bajando los omóplatos."]},
  {n:"Dominadas supinas", g:"espalda", eq:"Peso corporal",
   s:"Dorsal y bíceps.",
   e:["Encoger los hombros al subir.",
      "Sacar el pecho a costa de arquear la lumbar."]},
  {n:"Jalón al pecho", g:"espalda", eq:"Polea",
   s:"Dorsal, al llevar los codos hacia las costillas.",
   e:["Echarte muy atrás y convertirlo en un remo.",
      "Llevar la barra detrás de la nuca."]},
  {n:"Jalón agarre neutro", g:"espalda", eq:"Polea",
   s:"Dorsal bajo y parte media de la espalda.",
   e:["Tirar con los antebrazos en vez de con la espalda."]},
  {n:"Remo con barra", g:"espalda", eq:"Barra",
   s:"Centro de la espalda, entre los omóplatos.",
   e:["Redondear la lumbar.",
      "Tirar de la barra con impulso de cadera.",
      "Llevar la barra al pecho en vez de al ombligo."]},
  {n:"Remo con mancuerna a una mano", g:"espalda", eq:"Mancuernas",
   s:"Dorsal del lado que trabaja, con estiramiento abajo.",
   e:["Girar el tronco para subir más peso.",
      "Terminar el tirón con el codo muy abierto."]},
  {n:"Remo en polea sentado", g:"espalda", eq:"Polea",
   s:"Espalda media y dorsal.",
   e:["Mecerte adelante y atrás.",
      "Encoger los hombros al final del tirón."]},
  {n:"Remo en máquina", g:"espalda", eq:"Máquina",
   s:"Espalda media, con el pecho apoyado.",
   e:["Despegar el pecho del apoyo.",
      "Recorrido corto por exceso de peso."]},
  {n:"Remo en barra T", g:"espalda", eq:"Barra",
   s:"Espalda media y dorsal.",
   e:["Subir la cadera en cada repetición.",
      "Perder la posición neutra de la columna."]},
  {n:"Face pull", g:"espalda", eq:"Polea",
   s:"Parte trasera del hombro y entre los omóplatos.",
   e:["Usar demasiado peso y tirar con los brazos.",
      "Llevar la cuerda al pecho en vez de a la cara."]},
  {n:"Pullover en polea", g:"espalda", eq:"Polea",
   s:"Dorsal, en el costado, con los codos casi fijos.",
   e:["Doblar los codos y convertirlo en extensión de tríceps."]},
  {n:"Peso muerto", g:"espalda", eq:"Barra",
   s:"Toda la cadena posterior: glúteo, femoral y espalda baja.",
   e:["Redondear la lumbar al despegar.",
      "Empezar con la barra lejos de la espinilla.",
      "Estirar el cuello hacia arriba."]},

  /* ---------------- HOMBROS ---------------- */
  {n:"Press militar de pie", g:"hombros", eq:"Barra",
   s:"Hombro delantero y lateral; abdomen firme para no arquear.",
   e:["Arquear la lumbar para empujar.",
      "No pasar la cabeza al final del recorrido."]},
  {n:"Press hombro con mancuernas", g:"hombros", eq:"Mancuernas",
   s:"Hombro delantero y lateral.",
   e:["Bajar demasiado si el hombro te molesta.",
      "Chocar las mancuernas arriba."]},
  {n:"Press Arnold", g:"hombros", eq:"Mancuernas",
   s:"Hombro delantero, con el giro sumando recorrido.",
   e:["Girar con peso excesivo y tironear el hombro."]},
  {n:"Elevaciones laterales", g:"hombros", eq:"Mancuernas",
   s:"Lateral del hombro, justo encima del brazo.",
   e:["Subir por encima del hombro: entra el trapecio.",
      "Impulsar con las piernas.",
      "Bajar sin control."]},
  {n:"Elevaciones laterales en polea", g:"hombros", eq:"Polea",
   s:"Lateral del hombro, con tensión desde el primer grado.",
   e:["Inclinarte demasiado y cambiar el ángulo."]},
  {n:"Elevaciones frontales", g:"hombros", eq:"Mancuernas",
   s:"Parte delantera del hombro.",
   e:["Balancear el tronco.",
      "Subir más allá de la horizontal sin necesidad."]},
  {n:"Elevaciones posteriores (pájaros)", g:"hombros", eq:"Mancuernas",
   s:"Parte trasera del hombro.",
   e:["Juntar los omóplatos: eso lo convierte en espalda.",
      "Usar peso que te obliga a doblar los codos."]},
  {n:"Encogimientos de hombros", g:"hombros", eq:"Mancuernas",
   s:"Trapecio, subiendo recto hacia las orejas.",
   e:["Rotar los hombros en círculos.",
      "Recorrido mínimo por exceso de peso."]},

  /* ---------------- BÍCEPS ---------------- */
  {n:"Curl con barra", g:"biceps", eq:"Barra",
   s:"Bíceps, sin que el codo se vaya adelante.",
   e:["Balancear el tronco.",
      "Adelantar los codos al subir.",
      "Bajar sin control."]},
  {n:"Curl con mancuernas", g:"biceps", eq:"Mancuernas",
   s:"Bíceps, con giro de muñeca al final.",
   e:["Encoger el hombro para ayudarte."]},
  {n:"Curl martillo", g:"biceps", eq:"Mancuernas",
   s:"Braquial y antebrazo, en el lateral del brazo.",
   e:["Girar la muñeca: deja de ser martillo."]},
  {n:"Curl predicador (banca Scott)", g:"biceps", eq:"Máquina",
   s:"Bíceps en la parte baja del recorrido.",
   e:["Estirar de golpe abajo.",
      "Despegar los codos del apoyo."]},
  {n:"Curl inclinado", g:"biceps", eq:"Mancuernas",
   s:"Estiramiento del bíceps con el brazo detrás del cuerpo.",
   e:["Adelantar el hombro para subir más."]},
  {n:"Curl en polea", g:"biceps", eq:"Polea",
   s:"Bíceps con tensión constante.",
   e:["Retroceder para ayudarte con el peso."]},

  /* ---------------- TRÍCEPS ---------------- */
  {n:"Extensión de tríceps en polea", g:"triceps", eq:"Polea",
   s:"Parte trasera del brazo, al estirar el codo.",
   e:["Mover los codos hacia delante y atrás.",
      "Inclinarte para empujar con el cuerpo."]},
  {n:"Extensión de tríceps sobre la cabeza", g:"triceps", eq:"Polea",
   s:"Cabeza larga del tríceps, con estiramiento arriba.",
   e:["Arquear la lumbar.",
      "Abrir los codos en cada repetición."]},
  {n:"Press francés", g:"triceps", eq:"Barra",
   s:"Tríceps, con estiramiento cerca de la frente.",
   e:["Bajar hacia la nariz y cargar el codo.",
      "Mover los hombros en vez de solo el codo."]},
  {n:"Fondos en banco", g:"triceps", eq:"Peso corporal",
   s:"Tríceps; el hombro no debería doler.",
   e:["Bajar demasiado y forzar el hombro.",
      "Alejar mucho los pies y convertirlo en pecho."]},
  {n:"Patada de tríceps", g:"triceps", eq:"Mancuernas",
   s:"Tríceps al final del estiramiento del codo.",
   e:["Bajar el codo al estirar.",
      "Usar demasiado peso: es un ejercicio de detalle."]},
  {n:"Press banca agarre cerrado", g:"triceps", eq:"Barra",
   s:"Tríceps y pecho interno.",
   e:["Juntar tanto las manos que duela la muñeca.",
      "Abrir los codos."]},

  /* ---------------- PIERNA ---------------- */
  {n:"Sentadilla", g:"pierna", eq:"Barra",
   s:"Cuádriceps y glúteo; el peso repartido en todo el pie.",
   e:["Que las rodillas se vayan hacia dentro.",
      "Levantar los talones.",
      "Redondear la zona lumbar abajo."]},
  {n:"Sentadilla frontal", g:"pierna", eq:"Barra",
   s:"Cuádriceps, con el tronco más vertical.",
   e:["Dejar caer los codos y perder la barra.",
      "Inclinarte adelante como en la sentadilla trasera."]},
  {n:"Prensa de piernas", g:"pierna", eq:"Máquina",
   s:"Cuádriceps y glúteo.",
   e:["Despegar la cadera del respaldo abajo.",
      "Estirar la rodilla de golpe arriba."]},
  {n:"Sentadilla hack", g:"pierna", eq:"Máquina",
   s:"Cuádriceps, sobre todo en la parte baja.",
   e:["Recorrido corto.",
      "Pies demasiado adelantados si buscas cuádriceps."]},
  {n:"Zancadas con mancuernas", g:"pierna", eq:"Mancuernas",
   s:"Cuádriceps y glúteo de la pierna de delante.",
   e:["Paso corto: carga toda la rodilla.",
      "Inclinar el tronco de más."]},
  {n:"Sentadilla búlgara", g:"pierna", eq:"Mancuernas",
   s:"Cuádriceps y glúteo de la pierna de apoyo.",
   e:["Pie de apoyo demasiado cerca del banco.",
      "Empujar con la pierna de atrás."]},
  {n:"Extensión de cuádriceps", g:"pierna", eq:"Máquina",
   s:"Cuádriceps aislado, sobre la rodilla.",
   e:["Lanzar el peso con impulso.",
      "Soltar de golpe en la bajada."]},
  {n:"Curl femoral tumbado", g:"pierna", eq:"Máquina",
   s:"Parte posterior del muslo.",
   e:["Despegar la cadera del banco.",
      "Recorrido corto."]},
  {n:"Peso muerto rumano", g:"pierna", eq:"Barra",
   s:"Estiramiento claro en el femoral, con la espalda recta.",
   e:["Doblar mucho las rodillas: pasa a ser peso muerto.",
      "Redondear la espalda al bajar.",
      "Alejar la barra del cuerpo."]},
  {n:"Elevación de talones de pie", g:"pierna", eq:"Máquina",
   s:"Pantorrilla, con recorrido completo arriba y abajo.",
   e:["Rebotar sin llegar al estiramiento.",
      "Doblar las rodillas para ayudarte."]},
  {n:"Elevación de talones sentado", g:"pierna", eq:"Máquina",
   s:"Sóleo, la parte profunda de la pantorrilla.",
   e:["Recorrido corto."]},

  /* ---------------- GLÚTEO ---------------- */
  {n:"Hip thrust", g:"gluteo", eq:"Barra",
   s:"Glúteo en la parte alta, al apretar arriba.",
   e:["Arquear la lumbar en vez de meter la cadera.",
      "Empujar con las puntas de los pies.",
      "No hacer pausa arriba."]},
  {n:"Puente de glúteo", g:"gluteo", eq:"Peso corporal",
   s:"Glúteo, sin que trabaje el femoral.",
   e:["Subir empujando con los talones muy lejos."]},
  {n:"Patada de glúteo en polea", g:"gluteo", eq:"Polea",
   s:"Glúteo de la pierna que se mueve.",
   e:["Arquear la lumbar para llegar más atrás."]},
  {n:"Abducción de cadera en máquina", g:"gluteo", eq:"Máquina",
   s:"Glúteo medio, en el lateral de la cadera.",
   e:["Usar impulso.",
      "Inclinarte más de la cuenta."]},
  {n:"Peso muerto sumo", g:"gluteo", eq:"Barra",
   s:"Glúteo y aductores.",
   e:["Separar los pies más de lo que tu cadera permite.",
      "Perder la espalda neutra."]},

  /* ---------------- CORE ---------------- */
  {n:"Plancha", g:"core", eq:"Peso corporal",
   s:"Abdomen firme de arriba abajo, sin tensión lumbar.",
   e:["Dejar caer la cadera.",
      "Subir el glúteo para descansar.",
      "Aguantar la respiración."]},
  {n:"Plancha lateral", g:"core", eq:"Peso corporal",
   s:"Costado del abdomen.",
   e:["Dejar caer la cadera.",
      "Girar el tronco."]},
  {n:"Crunch en polea", g:"core", eq:"Polea",
   s:"Abdomen superior, acortando la distancia costillas-pelvis.",
   e:["Tirar con los brazos.",
      "Mover solo la cadera."]},
  {n:"Elevación de piernas colgado en barra", g:"core", eq:"Peso corporal",
   s:"Abdomen bajo.",
   e:["Balancearte.",
      "Subir solo las rodillas sin llevar la pelvis."]},
  {n:"Rueda abdominal", g:"core", eq:"Peso corporal",
   s:"Todo el abdomen, aguantando que la cadera no caiga.",
   e:["Arquear la lumbar al extender.",
      "Ir más lejos de lo que puedes controlar."]},
  {n:"Pallof press", g:"core", eq:"Polea",
   s:"Abdomen resistiendo el giro.",
   e:["Girar el tronco: justamente es lo que hay que evitar."]}
];

/* Grupos que el esquema sabe pintar, con su zona en el dibujo. */
const ZONAS = {
  pecho:   [["f", 50, 62, 30, 16]],
  espalda: [["b", 50, 64, 32, 20]],
  hombros: [["f", 30, 56, 12, 11], ["f", 70, 56, 12, 11], ["b", 30, 56, 12, 11], ["b", 70, 56, 12, 11]],
  biceps:  [["f", 25, 76, 10, 16], ["f", 75, 76, 10, 16]],
  triceps: [["b", 25, 76, 10, 16], ["b", 75, 76, 10, 16]],
  pierna:  [["f", 40, 118, 15, 30], ["f", 60, 118, 15, 30], ["b", 40, 122, 15, 32], ["b", 60, 122, 15, 32]],
  gluteo:  [["b", 50, 100, 30, 16]],
  core:    [["f", 50, 88, 22, 22]]
};

/* Un cuerpo de frente y otro de espalda, con el músculo objetivo
   encendido. Es un esquema, no una foto: sirve para ubicarte. */
function cuerpoSVG(grupo, color){
  const c = color || "#22e07a";
  const zonas = ZONAS[grupo] || [];
  const marcas = cara => zonas.filter(z=>z[0] === cara)
    .map(([,x,y,w,h])=>`<ellipse cx="${x}" cy="${y}" rx="${w/2}" ry="${h/2}"
        fill="${c}" opacity=".85"/>`).join("");

  const silueta = `
    <circle cx="50" cy="20" r="11"/>
    <rect x="34" y="33" width="32" height="8" rx="4"/>
    <rect x="35" y="41" width="30" height="52" rx="10"/>
    <rect x="18" y="44" width="13" height="46" rx="6"/>
    <rect x="69" y="44" width="13" height="46" rx="6"/>
    <rect x="37" y="92" width="12" height="62" rx="6"/>
    <rect x="51" y="92" width="12" height="62" rx="6"/>`;

  const cara = (id, marcasHTML, etiqueta) => `
    <g transform="translate(${id === "f" ? 0 : 110},0)">
      <g fill="currentColor" opacity=".12">${silueta}</g>
      ${marcasHTML}
      <text x="50" y="170" text-anchor="middle" font-size="9"
            fill="currentColor" opacity=".45">${etiqueta}</text>
    </g>`;

  return `<svg viewBox="0 0 210 178" class="cuerpo" role="img"
      aria-label="Esquema del músculo que trabaja">
      ${cara("f", marcas("f"), "FRENTE")}
      ${cara("b", marcas("b"), "ESPALDA")}
    </svg>`;
}

global.COACH_ALE_EJERCICIOS = {lista: EJERCICIOS, cuerpoSVG};
})(window);
