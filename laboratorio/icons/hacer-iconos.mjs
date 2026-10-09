/* Genera los iconos de Palanca sin depender de nada instalado.
   El dibujo es una barra apoyada en un fulcro: el concepto entero del
   laboratorio en una figura que se reconoce a 48 píxeles.

   Escribe el PNG a mano (zlib viene con Node) porque esta máquina no
   tiene ni rsvg ni ImageMagick ni Pillow, y encadenar capturas del
   navegador para esto era peor.

   Uso:  node laboratorio/icons/hacer-iconos.mjs                        */

import {deflateSync} from "node:zlib";
import {writeFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const AZUL  = [0x0f, 0x62, 0xd6];
const AMBAR = [0xfb, 0xbf, 0x24];
const BLANCO = [255, 255, 255];

/* ---------- geometría ---------- */
const rad = g => g*Math.PI/180;
const gira = (x, y, a) => [x*Math.cos(a) - y*Math.sin(a), x*Math.sin(a) + y*Math.cos(a)];

/* Rectángulo redondeado centrado en el origen. */
function enBarra(x, y, w, h, r){
  const dx = Math.abs(x) - (w/2 - r), dy = Math.abs(y) - (h/2 - r);
  if(dx <= 0 || dy <= 0) return Math.abs(x) <= w/2 && Math.abs(y) <= h/2;
  return dx*dx + dy*dy <= r*r;
}
function enRectRedondo(x, y, lado, r){
  return enBarra(x - lado/2, y - lado/2, lado, lado, r);
}
const enCirculo = (x, y, cx, cy, r) => (x-cx)**2 + (y-cy)**2 <= r*r;

/* Triángulo por el signo de los tres productos cruzados. */
function enTriangulo(x, y, a, b, c){
  const cruz = (p, q) => (q[0]-p[0])*(y-p[1]) - (q[1]-p[1])*(x-p[0]);
  const d1 = cruz(a,b), d2 = cruz(b,c), d3 = cruz(c,a);
  const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

/* ---------- el dibujo ---------- */
function pintar(S, recortable){
  const px = new Uint8Array(S*S*4);
  const M = 3;                              // supermuestreo, para los bordes
  const k = recortable ? S/512*0.60 : S/512; // el recortable deja zona segura
  const cx = S/2, cy = S/2 + (recortable ? 0 : S*0.012);
  const ang = rad(-17);

  for(let py=0; py<S; py++){
    for(let pxi=0; pxi<S; pxi++){
      let acc = [0,0,0], aAcc = 0;
      for(let sy=0; sy<M; sy++) for(let sx=0; sx<M; sx++){
        const X = pxi + (sx+0.5)/M, Y = py + (sy+0.5)/M;

        /* fondo */
        let col = null, a = 0;
        if(recortable || enRectRedondo(X, Y, S, S*0.22)){ col = AZUL; a = 1; }

        /* en coordenadas del dibujo, centradas y sin la inclinación */
        const ux = (X - cx)/k, uy = (Y - cy)/k;
        const [bx, by] = gira(ux, uy, -ang);

        if(a){
          /* Barra y fulcro, y nada más: a 48 píxeles cualquier añadido
             se convierte en una mancha. Probé una pesa en el extremo y
             el icono pasaba a parecer un martillo. */
          if(enBarra(bx, by, 372, 46, 23)) col = BLANCO;
          if(enTriangulo(ux, uy, [0,36], [96,184], [-96,184])) col = AMBAR;
        }
        if(a){ acc[0]+=col[0]; acc[1]+=col[1]; acc[2]+=col[2]; aAcc++; }
      }
      const n = M*M, i = (py*S + pxi)*4;
      if(aAcc){
        px[i]   = Math.round(acc[0]/aAcc);
        px[i+1] = Math.round(acc[1]/aAcc);
        px[i+2] = Math.round(acc[2]/aAcc);
        px[i+3] = Math.round(255*aAcc/n);
      }
    }
  }
  return px;
}

/* ---------- escribir el PNG ---------- */
const TABLA_CRC = (()=>{
  const t = new Uint32Array(256);
  for(let n=0; n<256; n++){
    let c = n;
    for(let k=0; k<8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf){
  let c = 0xffffffff;
  for(const b of buf) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function trozo(tipo, datos){
  const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}
function png(S, px){
  const cruda = Buffer.alloc(S*(S*4 + 1));
  for(let y=0; y<S; y++){
    cruda[y*(S*4+1)] = 0;                        // filtro "ninguno"
    Buffer.from(px.buffer, y*S*4, S*4).copy(cruda, y*(S*4+1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
    trozo("IHDR", ihdr),
    trozo("IDAT", deflateSync(cruda, {level:9})),
    trozo("IEND", Buffer.alloc(0))
  ]);
}

/* ---------- los cuatro ---------- */
for(const [nombre, S, recortable] of [
  ["icon-512.png", 512, false],
  ["icon-192.png", 192, false],
  ["apple-touch-icon.png", 180, false],
  ["maskable-512.png", 512, true]
]){
  const archivo = join(AQUI, nombre);
  writeFileSync(archivo, png(S, pintar(S, recortable)));
  console.log(nombre, "·", S + "×" + S);
}
