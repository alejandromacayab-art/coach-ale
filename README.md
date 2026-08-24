# 🏋️ Coach Ale — app de registro personal

App web instalable (PWA) para registrar hábitos, entrenamiento, alimentación y sueño.
Funciona sin internet y guarda todo en tu propio dispositivo.

```
index.html              la app completa
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

## Sincronización entre dispositivos

Los registros viven en tu dispositivo, pero pueden sincronizarse con el repositorio
**privado** `coach-ale-datos`, de modo que el celular y el computador vean lo mismo.

1. Crea una clave en <https://github.com/settings/personal-access-tokens/new>
   - Expiración: *No expiration* (o un año)
   - Repository access: *Only select repositories* → **coach-ale-datos**
   - Permissions → Repository permissions → **Contents: Read and write**
2. Pégala en la app, en **Ajustes → Sincronización entre dispositivos**.
3. Repite el paso 2 en cada dispositivo.

La clave se guarda solo en el dispositivo donde la pegas; nunca se sube al repositorio
público ni viaja a ningún otro sitio. Si la pierdes o la revocas, basta con generar otra.

**Cómo resuelve los conflictos.** Cada día registrado lleva su propia marca de tiempo y
solo se actualiza cuando algo cambia de verdad. Al sincronizar, para cada día gana la
versión modificada más tarde, así que editar el lunes en el celular y el martes en el
computador no pisa nada. Los hábitos y los ajustes viajan juntos con su propia marca.
Cada guardado queda como un commit, así que siempre puedes recuperar una versión anterior.

La app sincroniza sola al abrirse, al volver a ella, unos segundos después de cada cambio
y cada cinco minutos. También hay un botón para hacerlo a mano.

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
