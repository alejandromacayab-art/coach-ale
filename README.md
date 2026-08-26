# 🏋️ Coach Ale — app de registro personal

App web instalable (PWA) para registrar hábitos, entrenamiento, alimentación y sueño.
Funciona sin internet y guarda todo en tu propio dispositivo.

```
index.html              la app del deportista
panel.html + panel.js   el panel del entrenador
nube.js                 capa de datos: cuentas y sincronización
config.js               los dos valores de conexión a la base de datos
estilos.css             hoja de estilos común
base-de-datos/          esquema y permisos de PostgreSQL
vendor/                 librería de Supabase (incluida, funciona sin internet)
sw.js                   service worker: caché offline + recepción de notificaciones
manifest.webmanifest    datos de instalación (nombre, iconos, colores)
icons/                  iconos de la app (logo de Coach Ale)
assets/                 logotipo en versión clara y oscura
push/                   servidor de alertas (Node + web-push)
.github/workflows/      cron que envía las alertas cada 30 minutos
```

---

## Paso 0 · Qué se puede y qué no

| | Alertas mientras usas la app | Alertas con el celular guardado |
|---|---|---|
| Abrir `index.html` con doble clic | ✅ | ❌ |
| Publicada en https + instalada en el celular | ✅ | ✅ (requiere los pasos 1 a 5) |

En **iPhone hace falta iOS 16.4 o superior**, abrirla en **Safari** y **agregarla a la pantalla de inicio**.
Apple no permite notificaciones a webs que no estén instaladas.

---

## Paso 1 · Publicar la app (GitHub Pages)

1. Crea un repositorio nuevo en GitHub, por ejemplo `bienestar`. Puede ser **privado**:
   GitHub Pages funciona igual en repos privados con cuenta gratuita si lo publicas desde Actions,
   o hazlo público si prefieres lo más simple.
2. Sube el contenido de esta carpeta:

   ```bash
   cd "/Users/alejandromacaya/app personal"
   git init -b main
   git add .
   git commit -m "App de bienestar"
   git remote add origin https://github.com/TU-USUARIO/bienestar.git
   git push -u origin main
   ```

3. En el repo: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
4. A los dos minutos tendrás la dirección `https://TU-USUARIO.github.io/bienestar/`.

---

## Paso 2 · Generar las claves de las alertas

```bash
cd "/Users/alejandromacaya/app personal/push"
npm install
npm run keys
```

Te imprime dos claves:

- **VAPID_PUBLIC_KEY** → pégala en `index.html`, en la línea
  `const PUSH_PUBLIC_KEY = "";` (entre las comillas). Sube el cambio con `git push`.
- **VAPID_PRIVATE_KEY** → nunca se sube al repositorio, solo va en los secretos.

En el repo, **Settings → Secrets and variables → Actions → New repository secret**, crea:

| Secreto | Valor |
|---|---|
| `VAPID_PUBLIC_KEY` | la clave pública |
| `VAPID_PRIVATE_KEY` | la clave privada |

---

## Paso 3 · Instalar la app en el iPhone

1. Abre `https://TU-USUARIO.github.io/bienestar/` en **Safari**.
2. Botón **Compartir** ⬆︎ → **Agregar a pantalla de inicio**.
3. Abre la app desde el icono de Coach Ale (ya no desde Safari).

---

## Paso 4 · Activar las alertas y registrar el dispositivo

1. Dentro de la app: **Ajustes → App en el celular → 🔔 Activar alertas en este dispositivo**.
   Acepta el permiso que pide iOS.
2. Toca **Copiar suscripción**.
3. Envíate ese texto (por correo o notas) y créalo como un tercer secreto en GitHub:

| Secreto | Valor |
|---|---|
| `PUSH_SUBSCRIPTION` | el texto copiado (empieza con `{"endpoint":`) |

> Si quieres alertas en varios dispositivos, repite el paso en cada uno y guarda
> todas las suscripciones juntas en un array: `[{...},{...}]`.

---

## Paso 5 · Probar

En el repo: **Actions → Alertas de Coach Ale → Run workflow**, elige `habits` y ejecútalo.
En unos segundos debería sonar el celular. Si llega, ya está todo funcionando.

A partir de ahí las alertas salen solas según `push/config.json`:

```json
"habitos":   { "desde": "08:00", "hasta": "22:00", "cadaMinutos": 120 },
"pantallas": { "hora": "21:00" },
"sueno":     { "hora": "08:00" }
```

Cambia esos horarios, haz `git push` y listo. La zona horaria también se configura ahí
(`"timezone": "America/Santiago"`).

---

---

## Cuentas y panel del entrenador

La app funciona en dos modos según `config.js`:

- **Sin configurar** — todo se guarda solo en el dispositivo. No hay cuentas ni panel.
- **Conectada a Supabase** — cada persona entra con correo y contraseña, sus datos viven en la
  base de datos y el entrenador ve el panel con todos sus deportistas.

Para conectarla, sigue `base-de-datos/README.md` y pega los dos valores en `config.js`.

**Cómo se entra.** Correo y contraseña, sin confirmación por correo: quien está
invitado crea su cuenta y entra en el acto. Solo el «olvidé mi contraseña» necesita
un envío de correo, sujeto al límite del plan gratuito de Supabase (2 por hora).

**Quién ve qué.** Los permisos no los decide la app, los decide PostgreSQL:
cada deportista alcanza únicamente sus propias filas, y el entrenador puede *leer*
—nunca escribir— las de los deportistas que tiene asignados. El registro está abierto: cualquiera con el enlace
crea su cuenta y aparece en el panel del entrenador. La primera cuenta que se
registre queda como entrenador.

**En vivo.** El panel se suscribe a los cambios de la base: cuando un deportista guarda
algo, su fila se actualiza sola y parpadea, sin recargar la página. El indicador de la
cabecera muestra si la conexión está viva. Por su parte, la app del deportista sube sus
datos unos segundos después de cada cambio y también al cerrarse o pasar a segundo plano,
para que nada se quede esperando en el teléfono.

**Puntaje del día.** Un solo número de 0 a 100, el mismo en toda la app: en el
anillo de Hoy, en el historial, en el mapa de constancia y en las estadísticas. Se
reparte en hábitos (60), sueño (25) y alimentación (15), y el desglose se muestra
bajo el anillo para que se vea de dónde sale. Sin check-in de sueño no se resta
nada: esos 25 puntos aparecen como disponibles, que motiva más que castigar. Cada
porción de comida chatarra descuenta 5 puntos de los 15 de alimentación.

Los días se nombran por tramos —impecable a partir de 90, gran día desde 75, buen
día desde 60— y se cuentan rachas de días buenos y de días sin chatarra.

**Calendario.** El mes completo en una cuadrícula, con cada día coloreado según su
puntaje y el número dentro. Tocando un día se abre su agenda: una nota general y una
línea por cada hora del día, de 06:00 a 23:00, con la madrugada plegada. Las notas
viven dentro del día, así que se sincronizan como todo lo demás.

**Salud.** Una pestaña más en la app: composición corporal (peso, grasa y músculo
con variaciones contra los 30 días anteriores y curva de peso), ficha médica de 31
campos con tamizaje cardiovascular, ficha nutricional y documentos en PDF o imagen.
Arriba aparece una banda de avisos con lo que hay que saber sin leer la ficha entera:
alergias a medicamentos, respuestas afirmativas del tamizaje, lesión activa y
certificado de aptitud vencido. El entrenador ve todo eso en la ficha del deportista.

La ficha organiza información, no la evalúa: no reemplaza un examen médico ni una
autorización deportiva, y la app lo dice donde corresponde.

**El panel** (`panel.html`) muestra el resumen del grupo, la tabla de deportistas con
cargas, sueño y semáforo de chatarra, y la ficha individual con el detalle día a día
de cada sesión: ejercicios, series y kilos.

## Sincronización entre dispositivos

Con la base de datos conectada, esto es automático: entras con tu correo en cualquier
dispositivo y ves lo mismo. Cada día es una fila con su propia marca de tiempo, y al
fusionar gana la versión modificada más tarde, así que usar el celular y el computador
el mismo día no pisa nada.

Si no conectas la base de datos, usa **Ajustes → Datos → Exportar** para llevarte un
respaldo `.json` e importarlo en el otro dispositivo.

## Detalles útiles

- **Los avisos son específicos.** La app guarda tu progreso del día en el navegador y el
  service worker lo lee al recibir la alerta, así que en vez de un texto genérico verás
  *"Vas 45% del día — 💧 te faltan 3 vasos"*. Si ya cerraste todo, el aviso lo dice.
  Y si ya marcaste "sin pantallas de noche", la alerta de las 21:00 no te molesta.
- **GitHub Actions se ejecuta cada 30 minutos** y puede retrasarse algunos minutos: las
  alertas llegan cerca de la hora, no al segundo exacto.
- **Los datos nunca salen de tu dispositivo.** Al servidor solo viaja la suscripción push,
  que no contiene tus registros. Igual conviene exportar el respaldo `.json` de vez en cuando
  desde Ajustes → Datos.
- **Si cambias de teléfono** o reinstalas la app, repite el paso 4: la suscripción anterior caduca.

## Probar el envío desde tu Mac

```bash
cd "/Users/alejandromacaya/app personal/push"
VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... PUSH_SUBSCRIPTION='{"endpoint":...}' node send.js --force habits
```
