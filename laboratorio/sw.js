/* Service worker de Palanca.
   Su alcance es /laboratorio/, así que controla solo esta app; la de
   entrenamiento sigue con el suyo. Los archivos del motor viven un nivel
   más arriba y se guardan igual: el alcance limita qué páginas controla,
   no qué direcciones puede guardar. */
const CACHE = "palanca-v4";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest",
  "./estilos.css", "./app.js", "./ficha.js",
  "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/maskable-512.png", "./icons/apple-touch-icon.png",
  "../ejercicios.js", "../biomecanica.js", "../modelos.js", "../torque-grafico.js"
];

/* Uno a uno y no con addAll: addAll es todo o nada, y un solo archivo que
   falle dejaba la app sin modo sin conexión entero. */
self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>
    Promise.all(SHELL.map(u => c.add(u).catch(err=>{
      console.warn("No se pudo guardar en caché:", u, err && err.message);
    })))
  ).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k.startsWith("palanca-") && k!==CACHE)
                            .map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});

/* Red primero, para que los cambios se vean; la caché es el respaldo. */
self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const fresco = /\.(html|js|css|webmanifest)$/.test(new URL(req.url).pathname) ||
                 req.mode === "navigate";
  const pedir = fresco ? fetch(new Request(req.url, {cache:"no-store"})) : fetch(req);
  e.respondWith(
    pedir.then(res=>{
      const copia = res.clone();
      caches.open(CACHE).then(c=>c.put(req, copia)).catch(()=>{});
      return res;
    }).catch(()=>
      caches.match(req, {ignoreSearch:true}).then(r=>{
        if(r) return r;
        /* El respaldo a la portada vale para una navegación y solo para
           eso: devolver HTML donde se espera un .js rompe en silencio. */
        if(req.mode === "navigate") return caches.match("./index.html");
        return new Response("", {status:504, statusText:"Sin conexión"});
      }))
  );
});
