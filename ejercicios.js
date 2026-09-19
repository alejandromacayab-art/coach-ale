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
  {n:"Press banca con mancuernas", g:"pecho", eq:"Mancuernas", req:"banco",
   s:"Estiramiento en el pecho abajo y contracción al juntar arriba.",
   e:["Chocar las mancuernas arriba y perder tensión.",
      "Bajar más de lo que tu hombro tolera.",
      "Girar las muñecas de forma brusca."]},
  {n:"Press inclinado con barra", g:"pecho", eq:"Barra",
   s:"En la parte alta del pecho, cerca de la clavícula.",
   e:["Inclinar el banco más de 45°: pasa a ser press de hombro.",
      "Bajar la barra al cuello en vez de a la parte alta del pecho."]},
  {n:"Press inclinado con mancuernas", g:"pecho", eq:"Mancuernas", req:"banco",
   s:"Parte alta del pecho, con estiramiento al bajar.",
   e:["Arquear la espalda hasta convertirlo en un press plano.",
      "Usar un peso que te obliga a lanzarlas con las piernas."]},
  {n:"Press declinado con barra", g:"pecho", eq:"Barra",
   s:"Parte baja del pecho.",
   e:["Bajar la barra demasiado alto.",
      "Soltar el agarre por la inclinación."]},
  {n:"Aperturas con mancuernas", g:"pecho", eq:"Mancuernas", req:"banco",
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
  {n:"Fondos en paralelas", g:"pecho", eq:"Peso corporal", req:"paralelas",
   s:"Pecho bajo y tríceps; inclínate hacia delante para el pecho.",
   e:["Bajar más allá de lo que el hombro aguanta.",
      "Quedarte vertical si buscas pecho."]},
  {n:"Flexiones de brazos", g:"pecho", eq:"Peso corporal",
   s:"Pecho y tríceps, con el abdomen firme.",
   e:["Dejar caer la cadera.",
      "Abrir los codos en cruz.",
      "Recorrido corto: baja hasta rozar el suelo."]},

  {n:"Flexiones inclinadas", g:"pecho", eq:"Peso corporal",
   s:"Pecho y tríceps, con menos peso encima: las manos en una mesa o un banco.",
   e:["Subir tanto el apoyo que ya no cuesta nada.",
      "Dejar caer la cadera: el cuerpo va recto de la cabeza a los talones."]},
  {n:"Flexiones declinadas", g:"pecho", eq:"Peso corporal",
   s:"Parte alta del pecho y hombro, con los pies elevados.",
   e:["Subir los pies más alto de lo que aguanta el hombro.",
      "Bajar la cabeza al suelo antes que el pecho."]},
  {n:"Press de pecho en máquina", g:"pecho", eq:"Máquina",
   s:"Pecho, con la espalda apoyada y el recorrido guiado.",
   e:["Sentarte con el asiento tan bajo que empujas hacia arriba.",
      "Bloquear los codos de golpe al final."]},
  {n:"Pullover con mancuerna", g:"pecho", eq:"Mancuernas", req:"banco",
   s:"Estiramiento en el pecho y el costado al llevar la mancuerna por detrás.",
   e:["Arquear la espalda baja para ganar recorrido.",
      "Doblar y estirar los codos: se convierte en un tríceps."]},
  /* ---------------- ESPALDA ---------------- */
  {n:"Dominadas", g:"espalda", eq:"Peso corporal", req:"barrafija",
   s:"Dorsal, desde la axila hasta el costado.",
   e:["Balancearte para subir.",
      "No estirar abajo y perder la mitad del recorrido.",
      "Tirar solo con los brazos: inicia bajando los omóplatos."]},
  {n:"Dominadas supinas", g:"espalda", eq:"Peso corporal", req:"barrafija",
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

  {n:"Remo invertido", g:"espalda", eq:"Peso corporal",
   s:"Espalda media, colgado bajo una barra baja o una mesa firme.",
   e:["Dejar caer la cadera y remar solo con los brazos.",
      "Poner el cuerpo tan vertical que casi no hay carga."]},
  {n:"Remo con banda elástica", g:"espalda", eq:"Banda elástica",
   s:"Espalda media, al llevar los codos hacia atrás contra la banda.",
   e:["Sujetar la banda tan cerca que no ofrece resistencia.",
      "Encoger los hombros hacia las orejas al tirar."]},
  {n:"Superman", g:"espalda", eq:"Peso corporal",
   s:"Zona lumbar y glúteo, boca abajo, levantando brazos y piernas.",
   e:["Tirar la cabeza hacia atrás: la nuca sigue al tronco.",
      "Subir a tirones en vez de mantener dos segundos arriba."]},
  {n:"Bird dog", g:"espalda", eq:"Peso corporal",
   s:"Lumbar y abdomen profundo, estirando brazo y pierna contrarios.",
   e:["Girar la cadera al estirar la pierna.",
      "Subir la pierna por encima de la línea del cuerpo."]},
  {n:"Hiperextensiones", g:"espalda", eq:"Máquina",
   s:"Lumbar, glúteo y femoral, al volver a la línea del cuerpo.",
   e:["Pasarte de la horizontal y arquear la espalda baja.",
      "Bajar y subir a velocidad, sin controlar."]},
  {n:"Buenos días", g:"espalda", eq:"Barra",
   s:"Femoral y lumbar, con la cadera yendo hacia atrás.",
   e:["Doblar la espalda en vez de la cadera.",
      "Cargar mucho peso: aquí manda la técnica, no el kilaje."]},
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

  {n:"Flexiones pica", g:"hombros", eq:"Peso corporal",
   s:"Hombro delantero, con la cadera alta y la cabeza bajando entre las manos.",
   e:["Bajar la frente muy por delante de las manos.",
      "Perder la forma de V y convertirlo en una flexión normal."]},
  {n:"Elevaciones laterales con banda", g:"hombros", eq:"Banda elástica",
   s:"Lateral del hombro, con la banda pisada bajo los pies.",
   e:["Subir por encima de la horizontal.",
      "Ayudarte con un impulso de cadera."]},
  {n:"Press de hombro en máquina", g:"hombros", eq:"Máquina",
   s:"Hombro delantero y lateral, con la espalda apoyada.",
   e:["Separar la espalda del respaldo para empujar más.",
      "Bajar tan poco que el recorrido se queda a medias."]},
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
  {n:"Curl inclinado", g:"biceps", eq:"Mancuernas", req:"banco",
   s:"Estiramiento del bíceps con el brazo detrás del cuerpo.",
   e:["Adelantar el hombro para subir más."]},
  {n:"Curl en polea", g:"biceps", eq:"Polea",
   s:"Bíceps con tensión constante.",
   e:["Retroceder para ayudarte con el peso."]},

  {n:"Curl con banda elástica", g:"biceps", eq:"Banda elástica",
   s:"Bíceps, con la tensión subiendo a medida que flexionas.",
   e:["Llevar los codos adelante al subir.",
      "Soltar la bajada de golpe: ahí está la mitad del trabajo."]},
  {n:"Curl concentrado", g:"biceps", eq:"Mancuernas",
   s:"Pico del bíceps, con el codo apoyado en el muslo.",
   e:["Balancear el cuerpo para subir el peso.",
      "Despegar el codo del muslo al final."]},
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
  {n:"Fondos en banco", g:"triceps", eq:"Peso corporal", req:"banco",
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

  {n:"Flexiones diamante", g:"triceps", eq:"Peso corporal",
   s:"Tríceps, con las manos juntas bajo el pecho.",
   e:["Abrir los codos a los lados: vuelve a ser pecho.",
      "Bajar solo la cabeza en vez del pecho."]},
  {n:"Extensión de tríceps con banda", g:"triceps", eq:"Banda elástica",
   s:"Tríceps, al estirar el codo contra la banda.",
   e:["Mover el hombro en vez del codo.",
      "Empezar con la banda ya sin tensión."]},
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
  {n:"Sentadilla búlgara", g:"pierna", eq:"Mancuernas", req:"banco",
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

  {n:"Sentadilla con peso corporal", g:"pierna", eq:"Peso corporal",
   s:"Cuádriceps y glúteo, bajando hasta donde la espalda se mantenga recta.",
   e:["Levantar los talones del suelo.",
      "Juntar las rodillas hacia dentro al subir.",
      "Quedarte a medio recorrido por costumbre."]},
  {n:"Sentadilla goblet", g:"pierna", eq:"Mancuernas",
   s:"Cuádriceps y glúteo, con la mancuerna pegada al pecho y el tronco vertical.",
   e:["Separar la mancuerna del cuerpo: se te va el tronco adelante.",
      "Dejar caer los codos por dentro de las rodillas al bajar."]},
  {n:"Zancadas sin peso", g:"pierna", eq:"Peso corporal",
   s:"Cuádriceps y glúteo de la pierna de delante.",
   e:["Dar un paso tan corto que la rodilla se va muy adelante.",
      "Apoyar la rodilla de atrás de golpe en el suelo."]},
  {n:"Subida al cajón", g:"pierna", eq:"Peso corporal", req:"banco",
   s:"Cuádriceps y glúteo de la pierna que sube, en un cajón o una silla firme.",
   e:["Impulsarte con la pierna de abajo en vez de subir con la de arriba.",
      "Usar un cajón tan alto que la cadera se tuerce."]},
  {n:"Sentadilla isométrica en pared", g:"pierna", eq:"Peso corporal",
   s:"Quemazón en el cuádriceps, con la espalda pegada a la pared.",
   e:["Apoyar las manos en los muslos para descargar.",
      "Quedarte por encima de los 90° de rodilla."]},
  {n:"Peso muerto rumano con mancuernas", g:"pierna", eq:"Mancuernas",
   s:"Estiramiento en el femoral, con la cadera yendo hacia atrás.",
   e:["Doblar la espalda en vez de la cadera.",
      "Bajar más allá de donde el femoral deja de estirar."]},
  {n:"Curl femoral sentado", g:"pierna", eq:"Máquina",
   s:"Parte posterior del muslo, con más estiramiento que tumbado.",
   e:["Despegar la cadera del asiento al tirar.",
      "Soltar el peso de vuelta sin controlar."]},
  {n:"Aductores en máquina", g:"pierna", eq:"Máquina",
   s:"Parte interna del muslo, al juntar las piernas.",
   e:["Abrir más de lo que tu cadera tolera.",
      "Cerrar de golpe y dejar que el peso te abra de vuelta."]},
  {n:"Elevación de talones sin peso", g:"pierna", eq:"Peso corporal",
   s:"Pantorrilla, subiendo lo más alto que puedas sobre las puntas.",
   e:["Rebotar sin llegar arriba del todo.",
      "Apoyarte con los brazos en vez de solo equilibrarte."]},
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

  {n:"Hip thrust con mancuerna", g:"gluteo", eq:"Mancuernas", req:"banco",
   s:"Glúteo en la parte alta, con la espalda apoyada en un banco o sofá.",
   e:["Arquear la espalda baja en vez de apretar el glúteo.",
      "Apoyar la mancuerna en el hueso de la cadera sin nada que amortigüe."]},
  {n:"Puente de glúteo a una pierna", g:"gluteo", eq:"Peso corporal",
   s:"Glúteo de la pierna apoyada, con la cadera nivelada.",
   e:["Dejar caer el lado de la pierna levantada.",
      "Empujar con el talón tan adelante que trabaja el femoral."]},
  {n:"Patada de glúteo en cuadrupedia", g:"gluteo", eq:"Peso corporal",
   s:"Glúteo de la pierna que sube, sin girar la cadera.",
   e:["Arquear la espalda baja para subir más la pierna.",
      "Ir rápido: aquí el recorrido es corto y hay que sentirlo."]},
  {n:"Caminata lateral con banda", g:"gluteo", eq:"Banda elástica",
   s:"Glúteo medio, en el lateral de la cadera.",
   e:["Juntar los pies del todo entre paso y paso.",
      "Inclinar el tronco hacia el lado que avanza."]},
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
  {n:"Elevación de piernas colgado en barra", g:"core", eq:"Peso corporal", req:"barrafija",
   s:"Abdomen bajo.",
   e:["Balancearte.",
      "Subir solo las rodillas sin llevar la pelvis."]},
  {n:"Rueda abdominal", g:"core", eq:"Peso corporal",
   s:"Todo el abdomen, aguantando que la cadera no caiga.",
   e:["Arquear la lumbar al extender.",
      "Ir más lejos de lo que puedes controlar."]},
  {n:"Pallof press", g:"core", eq:"Polea",
   s:"Abdomen resistiendo el giro.",
   e:["Girar el tronco: justamente es lo que hay que evitar."]},
  {n:"Crunch abdominal", g:"core", eq:"Peso corporal",
   s:"Abdomen superior, despegando solo los omóplatos del suelo.",
   e:["Tirar de la nuca con las manos.",
      "Subir todo el tronco: eso ya es flexor de cadera."]},
  {n:"Elevación de piernas tumbado", g:"core", eq:"Peso corporal",
   s:"Abdomen bajo, con la espalda baja pegada al suelo.",
   e:["Despegar la lumbar del suelo al bajar las piernas.",
      "Bajar tan rápido que el abdomen deja de trabajar."]},
  {n:"Bicicleta abdominal", g:"core", eq:"Peso corporal",
   s:"Oblicuos, al acercar codo y rodilla contrarios.",
   e:["Ir a toda velocidad sin llegar al giro.",
      "Tirar de la cabeza con las manos."]},
  {n:"Dead bug", g:"core", eq:"Peso corporal",
   s:"Abdomen profundo, aguantando que la espalda baja no se despegue.",
   e:["Estirar brazo y pierna más de lo que el abdomen aguanta.",
      "Aguantar la respiración: se respira durante todo el movimiento."]},
  {n:"Hollow hold", g:"core", eq:"Peso corporal",
   s:"Todo el abdomen, en forma de plátano con la lumbar pegada al suelo.",
   e:["Despegar la espalda baja del suelo.",
      "Bajar brazos y piernas tanto que pierdes la posición."]}
];

/* ============================================================
   EL CUERPO
   Un esquema anatómico, no un monigote: la silueta lleva las
   proporciones de una persona y cada músculo se pinta con su
   forma —el pectoral en abanico, el dorsal en ala, el cuádriceps
   en gota— para que ubiques dónde deberías sentirlo.
   Todo es SVG dibujado aquí: ni fotos de nadie, ni descargas.
   ============================================================ */

/* Silueta: cabeza, tronco, brazos y piernas. Las dos vistas comparten
   casi todo; la espalda solo cambia en los hombros y la cintura. */
const CUERPO = {
  cabeza:  `<ellipse cx="50" cy="18.5" rx="10" ry="12"/>
            <path d="M45.4 28 h9.2 v8 h-9.2 Z"/>`,
  /* Hombros anchos, cintura marcada y cadera algo más ancha que la cintura:
     esa V es lo que hace que se lea como un cuerpo y no como una campana. */
  tronco:  `<path d="M54.6 34 L62.6 36.8
              C68.6 38.4 72.8 41 74.6 45.2 C76.4 50 76 56 74.4 63.2
              C72.8 70.6 70.2 78 68.2 84 C66.4 89 64.6 93 63.4 96.6
              C62.8 98.8 62.6 100.4 62.8 102
              C64 105.4 65.6 108.4 66.6 111 C67 112.2 67.2 113.2 67.2 114
              L32.8 114 C32.8 113.2 33 112.2 33.4 111
              C34.4 108.4 36 105.4 37.2 102 C37.4 100.4 37.2 98.8 36.6 96.6
              C35.4 93 33.6 89 31.8 84 C29.8 78 27.2 70.6 25.6 63.2
              C24 56 23.6 50 25.4 45.2 C27.2 41 31.4 38.4 37.4 36.8
              L45.4 34 Z"/>`,
  /* El brazo nace dentro del hombro y se separa del costado a la altura de
     la cintura: si no, o flota o se funde con el tronco. */
  brazoD:  `<path d="M67.6 37.6
              C76.4 38.6 83 44.4 85.2 54.6 C86.4 61.6 85.8 69.8 84.4 78.2
              C83.2 86.2 81.4 93.6 80 100.4 C78.8 106.4 77.8 112.4 77 118.2
              C76.4 122.6 76 126.2 75.8 129
              C75.7 131.6 74.4 133 72.4 133 C70.4 133 69.2 131.6 69.2 129
              C69.4 125 70 120 70.8 114.2 C71.8 106.6 73 97.6 74 87.8
              C75 77.6 75.4 65.4 75.2 53.8 C75 47.2 72.4 41.2 67.6 37.6 Z"/>`,
  /* Muslo, rodilla y gemelo. Las piernas se tocan arriba y se separan al
     bajar: con una ranura recta de arriba abajo parecía un cuerpo partido. */
  piernaD: `<path d="M49.6 114 L67.2 114
              C68.2 122 68 131.4 66.8 140.6 C66 147.8 64.8 154 63.6 159.4
              C63 163 62.6 165.8 62.4 167.8
              C63.8 172 64.8 177 65 182.2 C65.2 187.6 64.4 192.8 63.2 197
              C62.4 201 61.8 205.6 61.4 209.6 C61.2 212.4 61 214.4 60.8 215.8
              L52.8 215.8 C52.7 212.4 52.6 208.4 52.6 203.6
              C52.5 196.2 52.4 188 52.3 180 C52.2 171.6 52 159.4 51.6 147
              C51.2 134.4 50.4 123 49.6 114 Z"/>`
};

/* Cada músculo con su forma. "f" es de frente, "b" de espalda.
   Los del lado derecho se espejan solos: x' = 100 - x. */
const MUSCULOS = {
  /* Pectoral: abanico que nace en el esternón y se abre hacia el hombro. */
  pecho: {f:[
    `<path d="M49.4 45.8 C43.4 45.4 37.4 46.6 33 49.2
              C29.4 51.4 27.6 54.6 27.8 58.4 C28 62.6 30.2 65.8 34 67.6
              C38.6 69.8 44 69.6 47.2 67 C48.8 65.6 49.4 63.4 49.4 60.4 Z"/>`]},
  /* Dorsal ancho: ala que baja de la axila a la cintura, y el trapecio arriba. */
  espalda: {b:[
    `<path d="M47.6 47.6 C41.4 48.4 35.6 51 31.8 54.8
              C28.8 57.8 27.6 61.8 28.8 66.6 C30.2 72.6 33 78.6 36.6 83.4
              C39.4 87.2 42.6 89.8 45.2 90.8 C47 91.4 47.8 90.4 47.8 88
              C47.8 82 47.8 74 47.8 66 C47.7 59 47.6 52.6 47.6 47.6 Z"/>`,
    `<path d="M48.2 36.2 C43 36.8 37.8 38.8 33.6 41.8
              C30.8 43.8 29 46.2 28.8 48.6 C32 45.8 36.4 43.8 41.2 42.8
              C44 42.2 46.4 41.9 48.2 41.9 Z"/>`]},
  /* Deltoides: casquete que cubre la punta del hombro. */
  hombros: {
    f:[`<path d="M75.2 43.6 C80.8 45.6 84.2 50.4 85 57.2
                 C85.4 61 84.6 63.4 82.6 64 C80 64.8 77.4 62.6 76 58
                 C74.8 54 74.4 48.8 74.8 44.4 Z"/>`],
    b:[`<path d="M75.2 43.6 C80.8 45.6 84.2 50.4 85 57.2
                 C85.4 61 84.6 63.4 82.6 64 C80 64.8 77.4 62.6 76 58
                 C74.8 54 74.4 48.8 74.8 44.4 Z"/>`]},
  /* Bíceps: bulto en la cara delantera del brazo. */
  biceps: {f:[
    `<path d="M76.6 62.4 C80.6 62.6 83.2 66.4 83.8 72.6
              C84.4 79 83 85.4 80.4 89.4 C78.6 92.2 76.4 92.2 75.2 89.4
              C73.6 85.6 73.4 79.2 74.2 72.6 C74.8 67.6 75.6 63.8 76.6 62.4 Z"/>`]},
  /* Tríceps: herradura en la cara de atrás, algo más larga que el bíceps. */
  triceps: {b:[
    `<path d="M77 60.4 C81.2 61 84.2 65.4 85 72.8
              C85.8 80.2 84.2 87.4 81.2 91.6 C79.2 94.4 77 94 75.8 90.8
              C74.4 87 74.2 79.6 75.2 72.2 C75.8 66.6 76.4 62.2 77 60.4 Z"/>`]},
  /* Recto abdominal en el centro y oblicuo en el costado. */
  core: {f:[
    `<path d="M48.6 69.6 L44.2 69.6
              C43.4 76.4 43 83.4 43 90 C43 96.6 43.4 102.4 44.4 107.2
              L48.6 107.2 Z"/>`,
    `<path d="M42.4 72.6 C40 73.8 38.2 76.4 37.4 80
              C36.4 84.6 36.8 90.6 38.2 96.6 C39.2 101 40.4 104.8 41.8 107.4
              C41.4 100.6 41.2 93.4 41.4 86.6 C41.6 81.4 42 76.8 42.4 72.6 Z"/>`]},
  /* Cuádriceps delante; isquios y gemelo detrás. */
  pierna: {
    f:[`<path d="M53 119.6 C57.8 119.4 61.8 122.4 64.2 127.6
                 C66.6 135.4 67 143 65.6 150.8 C64.4 157.8 62.2 163 59.6 165.4
                 C57.2 167.6 55 166.6 53.8 162.6 C52.8 158.8 52.6 151.4 52.6 141.6
                 C52.6 133 52.8 126 53 122 Z"/>`],
    b:[`<path d="M53 121.6 C57.2 121.4 61 124.4 63.2 129.6
                 C65.6 137.4 66 144.6 64.8 151.6 C63.6 158.2 61.4 163 58.8 165.2
                 C56.6 167 54.6 166 53.6 162.4 C52.8 158.8 52.6 151.6 52.6 142.4
                 C52.6 134 52.8 127.6 53 124 Z"/>`,
        `<path d="M53.8 172.8 C57 172.6 59.8 175.8 61.2 181.4
                 C62.6 187 62.4 192.6 60.8 196.2 C59.4 199.4 57.4 199.6 55.8 196.8
                 C54.4 194.2 53.8 189 53.8 182.4 C53.8 178.2 53.8 175 53.8 172.8 Z"/>`]},
  /* Glúteo: masa redondeada entre la cintura y el muslo. */
  gluteo: {b:[
    `<path d="M49.2 90.6 C44 90.8 39.2 93 36 96.8
              C32.8 100.6 31.8 105.6 33.2 110 C34.4 113.8 37.4 115.8 41.4 115.4
              C45.6 115 48.2 112 49.2 106.4 Z"/>`]}
};

/* Un cuerpo de frente y otro de espalda, con el músculo objetivo
   encendido. Es un esquema, no una foto: sirve para ubicarte. */
function cuerpoSVG(grupo, color){
  const c = color || "#22e07a";
  const m = MUSCULOS[grupo] || {};

  /* Casi todos los músculos son pares: se dibuja el derecho y se refleja.
     Los que ya cruzan el centro (pectoral, dorsal, glúteo) también, porque
     están dibujados desde la línea media hacia fuera. */
  const par = html => `${html}<g transform="translate(100,0) scale(-1,1)">${html}</g>`;

  const silueta = `
    <g>${CUERPO.cabeza}${CUERPO.tronco}</g>
    ${par(CUERPO.brazoD)}${par(CUERPO.piernaD)}`;

  const cara = (id, etiqueta)=>{
    const capas = (m[id] || []).join("");
    return `
    <g transform="translate(${id === "f" ? 0 : 108},0)">
      <g fill="currentColor" opacity=".13">${silueta}</g>
      <g fill="${c}" fill-opacity=".82" stroke="${c}" stroke-width="1.1"
         stroke-linejoin="round">${par(capas)}</g>
      <text x="50" y="230" text-anchor="middle" font-size="9.5"
            font-weight="700" letter-spacing=".5"
            fill="currentColor" opacity=".42">${etiqueta}</text>
    </g>`;
  };

  return `<svg viewBox="0 0 208 236" class="cuerpo" role="img"
      aria-label="Esquema del músculo que trabaja">
      ${cara("f", "FRENTE")}
      ${cara("b", "ESPALDA")}
    </svg>`;
}

global.COACH_ALE_EJERCICIOS = {lista: EJERCICIOS, cuerpoSVG};
})(window);
