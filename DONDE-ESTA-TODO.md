# Coach Ale · dónde está cada cosa

## 1. El código, en tu Mac

```
/Users/alejandromacaya/app personal/
```

Es la carpeta de trabajo. Todo se edita aquí y desde aquí se publica.

| Archivo | Qué es |
|---|---|
| `index.html` | La app del deportista, entera |
| `panel.html` + `panel.js` | El panel del entrenador |
| `ejercicios.js` | Los 99 ejercicios y la lámina de anatomía |
| `biomecanica.js` | Las tablas antropométricas y los cinco modelos de cálculo |
| `modelos.js` | Qué modelo le toca a cada ejercicio, y por qué |
| `torque-grafico.js` | La curva y el esquema, que usan las dos apps |
| `laboratorio/` | **Palanca**, la app de biomecánica, aparte |
| `laboratorio.html` | Reenvío a la carpeta, para enlaces antiguos |
| `nube.js` | Cuentas y sincronización |
| `config.js` | La conexión con la base de datos |
| `estilos.css` | Los estilos, compartidos por todas |
| `zoom.js` | El pellizco para acercar |
| `sw.js` | Funcionamiento sin internet y notificaciones |
| `assets/` `icons/` | Logotipo e iconos |
| `base-de-datos/` | El esquema SQL y cómo se monta |
| `push/` | El envío de alertas al celular |

**Archivos privados que nunca salen de tu Mac:**
`push/CLAVES-SECRETAS.txt` y `push/.vapid.json` — las claves de las notificaciones.

## 2. El repositorio, en GitHub

<https://github.com/alejandromacayab-art/coach-ale> · público

Guarda el historial completo: cada cambio, cuándo se hizo y por qué. Si algo se
rompe, desde ahí se recupera cualquier versión anterior.

Tus datos NO están aquí. Solo el código.

## 3. Las apps publicadas

<https://alejandromacayab-art.github.io/coach-ale/> — Coach Ale, el entrenamiento
<https://alejandromacayab-art.github.io/coach-ale/laboratorio/> — Palanca, la biomecánica

Son dos aplicaciones: cada una se instala por su cuenta, con su icono y su
nombre, y cada una funciona sin internet por separado. Comparten el motor
de cálculo (un solo juego de archivos, para que nunca den números
distintos) y el mismo almacenamiento del navegador: si el deportista tiene
las dos, Palanca usa su estatura, su peso y los kilos que levanta de verdad.

Sale sola del repositorio: cada vez que se sube un cambio, en un par de minutos
está en línea. El panel está en `/panel.html`.

## 4. Los datos, en Supabase

Proyecto `coach-ale-oficial` · <https://supabase.com/dashboard/project/raiukwvdjpmefgujubsq>

Aquí viven las cuentas y los registros de todos: los tuyos y los de tus
deportistas. Es lo único que contiene información personal.

- **Table Editor** → ver los datos
- **Authentication → Users** → las cuentas
- **SQL Editor** → consultas y cambios en la estructura

## 5. Copias de muestra (para revisar diseño)

Son copias con datos inventados, sin conexión a nada real:

- App: <https://claude.ai/code/artifact/002a74af-09bc-4d4e-8669-2df6798d05e3>
- Panel: <https://claude.ai/code/artifact/a504e015-663e-4333-9ac1-29060fc70ba1>

---

## Si mañana quieres seguir trabajando

Abre una conversación desde la carpeta `app personal` y pide lo que necesites.
Todo el contexto está en el repositorio y en este archivo.

## Si quieres llevártelo a otra parte

```bash
git clone https://github.com/alejandromacayab-art/coach-ale.git
```

Eso te baja el proyecto completo en cualquier computador. Para los datos, en
Supabase hay exportación de la base entera.
