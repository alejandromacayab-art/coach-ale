/* Coach Ale — control del zoom de la pantalla
   Safari en iOS ignora `minimum-scale` cuando el usuario pellizca, así que se
   puede alejar la app por debajo de su tamaño normal y todo queda diminuto.
   Aquí vigilamos el gesto a mano: dejamos acercar con pellizco (hasta el doble)
   y cortamos cualquier movimiento que fuera a dejar la escala por debajo de 1.
   El zoom por doble o triple toque queda anulado desde el CSS
   (`touch-action:manipulation`) para que no salte al tocar rápido. */
(function(){
  const vv = window.visualViewport;
  const meta = document.querySelector('meta[name="viewport"]');
  const MIN = 1;

  /* La escala real de la página en este momento (1 = tamaño normal). */
  const escalaActual = () => (vv && vv.scale) || 1;

  /* --- 1. El pellizco (eventos propios de WebKit) ---------------------
     e.scale es relativo al inicio del gesto, por eso lo multiplicamos por
     la escala que había cuando el usuario apoyó los dos dedos. */
  let alEmpezar = 1;
  const alejaDemasiado = e => alEmpezar * e.scale < MIN - 0.01;

  document.addEventListener("gesturestart", e=>{
    alEmpezar = escalaActual();
    if(alejaDemasiado(e)) e.preventDefault();
  }, {passive:false});

  ["gesturechange","gestureend"].forEach(ev=>
    document.addEventListener(ev, e=>{ if(alejaDemasiado(e)) e.preventDefault(); },
      {passive:false}));

  /* --- 2. Red de seguridad --------------------------------------------
     Si aun así la escala acaba por debajo de 1, la devolvemos a su sitio
     fijando el viewport un instante y soltándolo después. */
  let volviendo = false;
  function restablecer(){
    if(!meta || volviendo) return;
    volviendo = true;
    const normal = meta.content;
    meta.content = "width=device-width, initial-scale=1, minimum-scale=1, " +
                   "maximum-scale=1, user-scalable=no, viewport-fit=cover";
    setTimeout(()=>{ meta.content = normal; volviendo = false; }, 80);
  }

  if(vv) vv.addEventListener("resize", ()=>{
    if(vv.scale < MIN - 0.005) restablecer();
  });
})();
