// Pinta cualquier Imagen del contenido. Todo es SVG o HTML propio: sin recursos externos.
// Cada unidad del viewBox equivale a un píxel a 16 px de letra, y el ancho máximo va en rem:
// así los dibujos y su texto crecen con la letra de la app (perfil de baja visión).
import { createContext, useContext, useId } from "react";
import type { CSSProperties, ReactNode } from "react";
import { describirImagen, numeroEnTexto } from "../content/imagenes.ts";
import type { Lengua } from "../content/lengua.ts";
import type { ColorId, ElementoSerie, FormaId, Imagen, ObjetoId } from "../content/tipos.ts";
import "./ilustracion.css";

const TRAZO = "var(--ilu-trazo, #002048)";
const PAPEL = "var(--ilu-papel, #fff)";
const SUAVE = "var(--ilu-suave, #C6DCEF)";
const CRUZ = "var(--ilu-cruz, #D4351C)";

const ROJO = "#E8483A";
const NARANJA = "#F5912F";
const AMARILLO = "#FFC629";
const VERDE = "#4CB66B";
const VERDE_OSCURO = "#2E8B57";
const AZUL = "#3FA9F0";
const CELESTE = "#BDE7FB";
const MORADO = "#9A6BD6";
const ROSA = "#F49AC1";
const MARRON = "#B5763F";
const MADERA = "#E2B27A";
const GRIS = "#C3CFDB";
const CREMA = "#FFE3B8";
const PIEL = "#FFCFA6";

const r2 = (n: number): number => Math.round(n * 100) / 100;

function polar(cx: number, cy: number, radio: number, grados: number): readonly [number, number] {
  const a = (grados * Math.PI) / 180;
  return [r2(cx + radio * Math.cos(a)), r2(cy + radio * Math.sin(a))];
}

function poligono(cx: number, cy: number, radio: number, lados: number, giro: number): string {
  return Array.from({ length: lados }, (_, i) => polar(cx, cy, radio, giro + (360 / lados) * i).join(",")).join(" ");
}

function puntosEstrella(cx: number, cy: number, exterior: number, interior: number): string {
  return Array.from({ length: 10 }, (_, i) => polar(cx, cy, i % 2 === 0 ? exterior : interior, -90 + 36 * i).join(",")).join(" ");
}

// Dibuja una mitad y su reflejo respecto al eje vertical del lienzo de 64.
function simetrico(mitad: ReactNode): ReactNode {
  return (
    <>
      {mitad}
      <g transform="matrix(-1 0 0 1 64 0)">{mitad}</g>
    </>
  );
}

// Trazos gruesos con contorno: se pinta el trazo ancho oscuro y encima el de color.
function conContorno(d: string, ancho: number, color: string): ReactNode {
  return (
    <>
      <path d={d} strokeWidth={ancho + 6} />
      <path d={d} strokeWidth={ancho} stroke={color} />
    </>
  );
}

const OJOS = (x1: number, x2: number, y: number): ReactNode => (
  <>
    <circle cx={x1} cy={y} r="3" fill={TRAZO} stroke="none" />
    <circle cx={x2} cy={y} r="3" fill={TRAZO} stroke="none" />
  </>
);

// Los 60 objetos, en un lienzo común de 64 × 64. El grupo que los envuelve fija el trazo.
export const OBJETO_DIBUJOS: Readonly<Record<ObjetoId, ReactNode>> = {
  manzana: (
    <>
      <path d="M32 20c-6-5-20-5-23 8-3 14 6 30 14 31 4 .5 6-2 9-2s5 2.5 9 2c8-1 17-17 14-31-3-13-17-13-23-8Z" fill={ROJO} />
      <path d="M32 20c0-5 1-8 4-11" />
      <path d="M36 13c3-6 10-8 15-6-1 6-8 10-15 6Z" fill={VERDE} />
      <path d="M17 30c0-3 2-5 4-6" stroke={PAPEL} />
    </>
  ),
  pera: (
    <>
      <path d="M32 13c-6 0-8 5-9 11-1 5-9 9-10 18-1 11 9 18 19 18s20-7 19-18c-1-9-9-13-10-18-1-6-3-11-9-11Z" fill="#B7D84B" />
      <path d="M32 13c0-3 1-6 3-8" />
      <path d="M35 9c3-4 8-5 12-3-2 5-8 6-12 3Z" fill={VERDE} />
      <path d="M21 44c0-4 2-7 4-9" stroke={PAPEL} />
    </>
  ),
  naranja: (
    <>
      <circle cx="32" cy="36" r="25" fill={NARANJA} />
      <path d="M32 11c2-5 8-7 13-5-1 5-8 9-13 5Z" fill={VERDE} />
      <path d="M20 31h.01M27 44h.01M41 34h.01M44 46h.01M33 27h.01M18 44h.01" stroke="#C96A12" />
      <path d="M15 32c1-4 3-7 6-9" stroke={PAPEL} />
    </>
  ),
  lapiz: (
    <g transform="rotate(45 32 32)">
      <rect x="25" y="1" width="14" height="9" rx="3" fill={ROSA} />
      <rect x="25" y="10" width="14" height="6" fill={GRIS} />
      <rect x="25" y="16" width="14" height="30" fill={AMARILLO} />
      <path d="M32 16v30" stroke="#D99A00" strokeWidth="2" />
      <path d="M25 46 32 63 39 46Z" fill={CREMA} />
      <path d="M29.5 57 32 63 34.5 57Z" fill={TRAZO} />
    </g>
  ),
  libro: (
    <>
      <path d="M3 15v39c10-1 23 0 29 4 6-4 19-5 29-4V15Z" fill={AZUL} />
      <path d="M32 16C26 11 16 9 7 10v39c9-1 19 1 25 6Z" fill={PAPEL} />
      <path d="M32 16c6-5 16-7 25-6v39c-9-1-19 1-25 6Z" fill={PAPEL} />
      <path d="M13 19c5 0 9 1 13 3M13 28c5 0 9 1 13 3M13 37c5 0 9 1 13 3M51 19c-5 0-9 1-13 3M51 28c-5 0-9 1-13 3M51 37c-5 0-9 1-13 3" stroke={GRIS} />
    </>
  ),
  cuaderno: (
    <>
      <rect x="13" y="5" width="43" height="54" rx="5" fill={VERDE} />
      <rect x="26" y="15" width="23" height="13" rx="2" fill={PAPEL} />
      <path d="M30 20h15M30 24h10" stroke={GRIS} strokeWidth="2" />
      {[13, 22, 31, 40, 49].map((y) => (
        <path key={y} d={`M8 ${y}h10`} strokeWidth="4" />
      ))}
    </>
  ),
  pelota: (
    <>
      <circle cx="32" cy="32" r="28" fill={PAPEL} />
      <polygon points={poligono(32, 32, 12, 5, -90)} fill={TRAZO} />
      {[0, 72, 144, 216, 288].map((a) => (
        <g key={a} transform={`rotate(${a} 32 32)`}>
          <path d="M32 20v-8" />
          <path d="M24 5.5 32 12 40 5.5A28 28 0 0 0 24 5.5Z" fill={TRAZO} />
        </g>
      ))}
    </>
  ),
  flor: (
    <>
      <path d="M32 34v27" stroke={VERDE_OSCURO} strokeWidth="4" />
      <path d="M32 54c-2-7-9-10-16-8 1 7 9 11 16 8Z" fill={VERDE} />
      <path d="M32 50c2-6 8-9 14-7-1 6-8 10-14 7Z" fill={VERDE} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const [x, y] = polar(32, 22, 11.5, a - 90);
        return <circle key={a} cx={x} cy={y} r="8" fill={ROSA} />;
      })}
      <circle cx="32" cy="22" r="7" fill={AMARILLO} />
    </>
  ),
  arbol: (
    <>
      <path d="M26 42h12l2 19H24Z" fill={MARRON} />
      <path d="M32 3c-9 0-14 6-14 12-6 2-11 7-11 14 0 9 7 16 16 16h18c9 0 16-7 16-16 0-7-5-12-11-14 0-6-5-12-14-12Z" fill={VERDE} />
      <path d="M18 27c0-4 2-7 5-9" stroke={PAPEL} />
    </>
  ),
  hoja: (
    <>
      <path d="M11 53C6 30 21 8 58 6c2 34-17 52-47 47Z" fill={VERDE} />
      <path d="M4 61 44 20" />
      <path d="M21 43V29M21 43h14M31 33V21M31 33h13" strokeWidth="2.5" />
    </>
  ),
  estrella: <polygon points={puntosEstrella(32, 34, 29, 13)} fill={AMARILLO} />,
  sol: (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <path key={a} d="M27 14 32 3 37 14Z" fill={NARANJA} transform={`rotate(${a} 32 32)`} />
      ))}
      <circle cx="32" cy="32" r="17" fill={AMARILLO} />
      {OJOS(26, 38, 29)}
      <path d="M25 37c4 4 10 4 14 0" />
    </>
  ),
  luna: (
    <>
      <path d="M43 6a27 27 0 1 0 15 40A22 22 0 0 1 43 6Z" fill="#FFE27A" />
      <polygon points={puntosEstrella(49, 22, 8, 3.5)} fill={AMARILLO} strokeWidth="2" />
    </>
  ),
  nube: <path d="M16 51a12 12 0 0 1-2-24 16 16 0 0 1 30-6 13 13 0 0 1 6 30Z" fill="#E4F3FD" />,
  casa: (
    <>
      <rect x="43" y="10" width="8" height="14" fill={MARRON} />
      <rect x="11" y="29" width="42" height="31" fill={CREMA} />
      <path d="M4 31 32 7l28 24Z" fill={ROJO} />
      <rect x="17" y="40" width="12" height="20" fill={MARRON} />
      <rect x="35" y="38" width="12" height="12" fill={CELESTE} />
      <path d="M41 38v12M35 44h12" strokeWidth="2" />
    </>
  ),
  pez: (
    <>
      <path d="M46 32 60 19v26Z" fill={NARANJA} />
      <path d="M28 21c2-6 8-9 14-8l-3 11Z" fill={AMARILLO} />
      <path d="M5 32c8-15 31-19 44 0-13 19-36 15-44 0Z" fill={NARANJA} />
      <path d="M28 21c4 6 4 16 0 22M36 23c3 5 3 13 0 18" stroke={AMARILLO} />
      <circle cx="17" cy="29" r="4" fill={PAPEL} strokeWidth="2" />
      <circle cx="16" cy="29" r="1.5" fill={TRAZO} stroke="none" />
    </>
  ),
  pajaro: (
    <>
      <path d="M26 50v9m-4 0h8M37 49v10m-4 0h8" />
      <path d="M16 34 3 25l3 17 13 4Z" fill={AZUL} />
      <circle cx="30" cy="31" r="20" fill={AZUL} />
      <path d="M49 24 61 30 49 35Z" fill={AMARILLO} />
      <path d="M17 31c7-1 15 1 18 6-5 8-15 8-22 2Z" fill={CELESTE} />
      <circle cx="39" cy="24" r="4" fill={PAPEL} strokeWidth="2" />
      <circle cx="40" cy="24" r="1.7" fill={TRAZO} stroke="none" />
    </>
  ),
  gato: (
    <>
      <path d="M9 31c0-7 1-18 3-25l13 9c5-2 9-2 14 0l13-9c2 7 3 18 3 25 0 15-11 26-23 26S9 46 9 31Z" fill={NARANJA} />
      <path d="M15 14c-1 3-1 6-1 9l6-5ZM49 14c1 3 1 6 1 9l-6-5Z" fill={ROSA} strokeWidth="2" />
      {OJOS(23, 41, 31)}
      <path d="M29 39h6l-3 3.5Z" fill={ROSA} strokeWidth="2" />
      <path d="M32 43c-1 4-5 4-7 2M32 43c1 4 5 4 7 2" strokeWidth="2.5" />
      <path d="M3 34l12 3M3 45l12-3M61 34l-12 3M61 45l-12-3" strokeWidth="2.5" />
    </>
  ),
  perro: (
    <>
      <circle cx="32" cy="33" r="23" fill={MADERA} />
      <path d="M16 13C7 12 3 26 5 38c1 6 9 7 11 1l5-23Z" fill={MARRON} />
      <path d="M48 13c9-1 13 13 11 25-1 6-9 7-11 1l-5-23Z" fill={MARRON} />
      <ellipse cx="32" cy="43" rx="13" ry="10" fill={CREMA} />
      <ellipse cx="32" cy="37" rx="5" ry="3.5" fill={TRAZO} />
      <path d="M32 40v6M32 46c-2 3-6 3-8 1M32 46c2 3 6 3 8 1" strokeWidth="2.5" />
      <path d="M29 49h6v3a3 3 0 0 1-6 0Z" fill={ROSA} strokeWidth="2" />
      {OJOS(23, 41, 27)}
    </>
  ),
  mariposa: (
    <>
      {simetrico(
        <>
          <path d="M30 28C24 11 8 5 4 13c-3 8 4 21 26 19Z" fill={MORADO} />
          <path d="M30 34c-16 0-22 10-18 18 4 6 16 0 18-14Z" fill={ROSA} />
          <circle cx="14" cy="17" r="3.5" fill={AMARILLO} strokeWidth="2" />
          <circle cx="20" cy="45" r="2.5" fill={AMARILLO} strokeWidth="2" />
          <path d="M31 17c-1-5-4-9-8-10" />
        </>,
      )}
      <ellipse cx="32" cy="33" rx="3.5" ry="17" fill={TRAZO} />
    </>
  ),
  pato: (
    <>
      <path d="M16 32c-8 1-12 6-12 12 0 8 9 14 24 14 16 0 29-8 31-25-6 4-12 5-18 3-7-2-15-5-25-4Z" fill={AMARILLO} />
      <circle cx="23" cy="20" r="13" fill={AMARILLO} />
      <path d="M11 16 1 21l10 5c3 0 3-10 0-10Z" fill={NARANJA} />
      <path d="M28 41c6-4 15-3 19-1-2 7-13 11-21 6Z" fill="#FFE27A" />
      <circle cx="21" cy="17" r="2.7" fill={TRAZO} stroke="none" />
    </>
  ),
  rana: (
    <>
      <circle cx="18" cy="17" r="10" fill={VERDE} />
      <circle cx="46" cy="17" r="10" fill={VERDE} />
      <ellipse cx="32" cy="38" rx="28" ry="21" fill={VERDE} />
      <path d="M12 20c0-6 12-6 12 0 0 3-12 3-12 0ZM40 20c0-6 12-6 12 0 0 3-12 3-12 0Z" fill={VERDE} stroke="none" />
      <circle cx="18" cy="17" r="5" fill={PAPEL} strokeWidth="2" />
      <circle cx="46" cy="17" r="5" fill={PAPEL} strokeWidth="2" />
      <circle cx="18" cy="17" r="2.2" fill={TRAZO} stroke="none" />
      <circle cx="46" cy="17" r="2.2" fill={TRAZO} stroke="none" />
      <path d="M13 39c9 10 29 10 38 0" />
      <path d="M28 30h.01M36 30h.01" />
    </>
  ),
  vaca: (
    <>
      <path d="M21 15c-4-2-6-7-5-12 4 0 8 3 10 9ZM43 15c4-2 6-7 5-12-4 0-8 3-10 9Z" fill={CREMA} />
      <path d="M16 22c-6-3-12-1-14 4 4 5 11 5 15 2ZM48 22c6-3 12-1 14 4-4 5-11 5-15 2Z" fill={PAPEL} />
      <rect x="15" y="11" width="34" height="42" rx="15" fill={PAPEL} />
      <path d="M16 31c-2-10 3-19 12-20 3 5 1 15-4 19-3 2-6 3-8 1Z" fill={TRAZO} />
      <path d="M49 22c-3-5-7-9-11-10 0 4 2 9 6 11 2 1 4 1 5-1Z" fill={TRAZO} />
      <ellipse cx="32" cy="47" rx="16" ry="12" fill={ROSA} />
      <path d="M26 46h.01M38 46h.01" strokeWidth="4" />
      <circle cx="39" cy="31" r="3" fill={TRAZO} stroke="none" />
      <circle cx="25" cy="33" r="3" fill={PAPEL} stroke="none" />
      <circle cx="25" cy="33" r="1.8" fill={TRAZO} stroke="none" />
    </>
  ),
  oso: (
    <>
      <circle cx="14" cy="16" r="10" fill={MARRON} />
      <circle cx="50" cy="16" r="10" fill={MARRON} />
      <circle cx="14" cy="16" r="4.5" fill={MADERA} strokeWidth="2" />
      <circle cx="50" cy="16" r="4.5" fill={MADERA} strokeWidth="2" />
      <circle cx="32" cy="35" r="25" fill={MARRON} />
      <ellipse cx="32" cy="44" rx="12" ry="10" fill={MADERA} />
      <ellipse cx="32" cy="39" rx="4.5" ry="3" fill={TRAZO} />
      <path d="M32 42v4M26 47c3 3 9 3 12 0" strokeWidth="2.5" />
      {OJOS(23, 41, 30)}
    </>
  ),
  elefante: (
    <>
      <path d="M59 28c3 3 3 9 1 13" />
      <rect x="27" y="42" width="10" height="17" rx="3" fill={GRIS} />
      <rect x="45" y="42" width="10" height="17" rx="3" fill={GRIS} />
      <ellipse cx="41" cy="32" rx="19" ry="17" fill={GRIS} />
      <path d="M20 11c-9 0-15 7-15 15 0 7 0 14-1 20-.5 5 1 11 6 11s7-4 6-7h-4c0-3 1-9 3-13 2 2 4 2 6 2 8 0 13-6 13-14s-6-14-14-14Z" fill={GRIS} />
      <path d="M23 14c8-3 15 3 14 11-1 8-8 12-14 8Z" fill="#AAB9C8" />
      <circle cx="14" cy="23" r="2.7" fill={TRAZO} stroke="none" />
    </>
  ),
  hormiga: (
    <>
      <path d="M26 37 17 52l-5 1M30 38v15l-3 3M34 37l9 15 5 1" />
      <path d="M10 23C8 16 4 13 2 12M14 22c0-7 3-11 7-13" />
      <ellipse cx="47" cy="34" rx="14" ry="11" fill="#8A3F2C" />
      <circle cx="30" cy="33" r="7" fill="#8A3F2C" />
      <circle cx="14" cy="30" r="9" fill="#8A3F2C" />
      <circle cx="11" cy="28" r="2.5" fill={PAPEL} stroke="none" />
    </>
  ),
  moneda: (
    <>
      <circle cx="32" cy="32" r="28" fill={AMARILLO} />
      <circle cx="32" cy="32" r="21" stroke="#C98A00" />
      <polygon points={puntosEstrella(32, 33, 13, 5.5)} fill="#FFE27A" stroke="#C98A00" strokeWidth="2.5" />
    </>
  ),
  vaso: (
    <>
      <path d="M15 5h34l-4 54H19Z" fill={PAPEL} />
      <path d="M17.5 25h29l-2.7 33H20.2Z" fill={AZUL} stroke="none" />
      <path d="M15 5h34l-4 54H19Z" />
      <path d="M17 25c5-3 10 3 15 0s10 3 15 0" />
    </>
  ),
  botella: (
    <>
      <path d="M27 12v6c0 4-9 8-9 16v22c0 3 2 5 5 5h18c3 0 5-2 5-5V34c0-8-9-12-9-16v-6Z" fill={CELESTE} />
      <rect x="25" y="3" width="14" height="9" rx="2" fill={ROJO} />
      <rect x="18" y="35" width="28" height="15" fill={PAPEL} />
      <path d="M24 42.5h16" stroke={AZUL} strokeWidth="4" />
    </>
  ),
  taza: (
    <>
      <path d="M21 13c-3-3 3-5 0-9M33 13c-3-3 3-5 0-9" />
      {conContorno("M46 26h5c5 0 8 3 8 8s-3 8-8 8h-5", 4, ROJO)}
      <path d="M9 19h38v27c0 7-5 12-12 12H21c-7 0-12-5-12-12Z" fill={ROJO} />
      <path d="M16 28v14" stroke={PAPEL} />
    </>
  ),
  llave: (
    <g transform="rotate(-35 32 32)">
      <path d="M26 28h35v8h-5v9h-7v-9h-5v6h-7v-6H26Z" fill={AMARILLO} />
      <circle cx="16" cy="32" r="14" fill={AMARILLO} />
      <circle cx="12" cy="32" r="4.5" fill={PAPEL} />
    </g>
  ),
  mesa: (
    <>
      <path d="M12 26v34h8V34h24v26h8V26Z" fill={MARRON} />
      <rect x="3" y="17" width="58" height="10" rx="3" fill={MADERA} />
    </>
  ),
  silla: (
    <>
      <rect x="15" y="40" width="7" height="21" rx="3" fill={MARRON} />
      <rect x="42" y="40" width="7" height="21" rx="3" fill={MARRON} />
      <path d="M16 33V9c0-3 2-5 5-5h22c3 0 5 2 5 5v24" fill={MADERA} />
      <path d="M26 11v20M38 11v20" stroke={MARRON} strokeWidth="4" />
      <rect x="10" y="31" width="44" height="10" rx="4" fill={MARRON} />
    </>
  ),
  cama: (
    <>
      <rect x="3" y="14" width="9" height="46" rx="3" fill={MARRON} />
      <rect x="52" y="27" width="9" height="33" rx="3" fill={MARRON} />
      <rect x="10" y="37" width="44" height="14" fill={PAPEL} />
      <rect x="13" y="27" width="17" height="11" rx="5" fill={PAPEL} />
      <path d="M29 33h25v18H29Z" fill={AZUL} />
      <path d="M29 40h25" stroke={PAPEL} />
    </>
  ),
  puerta: (
    <>
      <rect x="13" y="3" width="38" height="57" rx="2" fill={MARRON} />
      <rect x="19" y="9" width="20" height="18" rx="1" fill={MADERA} />
      <rect x="19" y="33" width="20" height="21" rx="1" fill={MADERA} />
      <circle cx="45" cy="33" r="3" fill={AMARILLO} strokeWidth="2" />
      <path d="M4 61h56" />
    </>
  ),
  ventana: (
    <>
      <rect x="9" y="5" width="46" height="46" rx="2" fill={CELESTE} />
      <path d="M9 5h17c0 16-6 30-17 34ZM55 5H38c0 16 6 30 17 34Z" fill={ROSA} />
      <path d="M32 5v46M9 28h46" strokeWidth="2.5" />
      <rect x="4" y="51" width="56" height="8" rx="2" fill={MADERA} />
    </>
  ),
  zapato: (
    <>
      <path d="M6 20c5 3 12 3 16-1 3 9 12 15 22 17 9 1 15 4 15 13H6Z" fill={AZUL} />
      <path d="M25 29l6-5M31 35l6-5M38 39l5-6" stroke={PAPEL} />
      <path d="M4 49h56v4c0 3-2 5-5 5H9c-3 0-5-2-5-5Z" fill={PAPEL} />
    </>
  ),
  gorro: (
    <>
      <path d="M10 44c0-18 10-28 22-28s22 10 22 28Z" fill={ROJO} />
      <rect x="6" y="42" width="52" height="15" rx="6" fill={AMARILLO} />
      <path d="M16 45v9M26 45v9M38 45v9M48 45v9" strokeWidth="2.5" />
      <circle cx="32" cy="12" r="8" fill={PAPEL} />
    </>
  ),
  mochila: (
    <>
      <path d="M23 12c0-10 18-10 18 0" strokeWidth="4" />
      <rect x="5" y="30" width="8" height="20" rx="4" fill={NARANJA} />
      <rect x="51" y="30" width="8" height="20" rx="4" fill={NARANJA} />
      <rect x="11" y="9" width="42" height="50" rx="13" fill={AZUL} />
      <path d="M11 27h42" />
      <rect x="19" y="36" width="26" height="17" rx="4" fill={NARANJA} />
      <path d="M26 42h12" />
      <rect x="28" y="23" width="8" height="8" rx="2" fill={AMARILLO} strokeWidth="2" />
    </>
  ),
  paraguas: (
    <>
      <path d="M32 3v6" />
      <path d="M32 33v20c0 8 12 8 12 0" strokeWidth="4" />
      <path d="M3 35C5 17 18 8 32 8s27 9 29 27c-4-5-11-5-14.5 0-4-5-10.5-5-14.5 0-4-5-10.5-5-14.5 0-3.5-5-10.5-5-14.5 0Z" fill={MORADO} />
      <path d="M32 8c-7 6-10 15-10 22M32 8c7 6 10 15 10 22" stroke={ROSA} strokeWidth="2.5" />
    </>
  ),
  coche: (
    <>
      <path d="M3 46v-9c0-3 2-5 5-5h6l7-12c1-2 3-3 5-3h14c2 0 4 1 5 3l7 12h4c3 0 5 2 5 5v9Z" fill={ROJO} />
      <path d="M20 32l5-9h6v9ZM37 23h4l5 9h-9Z" fill={CELESTE} strokeWidth="2.5" />
      <circle cx="18" cy="47" r="8" fill={TRAZO} />
      <circle cx="46" cy="47" r="8" fill={TRAZO} />
      <circle cx="18" cy="47" r="3" fill={GRIS} stroke="none" />
      <circle cx="46" cy="47" r="3" fill={GRIS} stroke="none" />
    </>
  ),
  bicicleta: (
    <>
      <circle cx="14" cy="43" r="12" fill={PAPEL} />
      <circle cx="50" cy="43" r="12" fill={PAPEL} />
      <path d="M14 43h17L44 26H24ZM24 26l7 17M44 26l6 17" stroke={ROJO} strokeWidth="3.5" />
      <path d="M24 26l-2-6M18 20h9M44 26l-3-10h8" strokeWidth="3.5" />
      <circle cx="31" cy="43" r="3" fill={AMARILLO} strokeWidth="2" />
      <circle cx="14" cy="43" r="1.5" fill={TRAZO} />
      <circle cx="50" cy="43" r="1.5" fill={TRAZO} />
    </>
  ),
  barco: (
    <>
      <path d="M32 5v35" />
      <path d="M35 8 54 35H35Z" fill={PAPEL} />
      <path d="M29 15 13 35h16Z" fill={AMARILLO} />
      <path d="M5 40h54l-8 15H13Z" fill={ROJO} />
      <path d="M3 60c5-4 10-4 14.5 0s10 4 14.5 0 10-4 14.5 0 10 4 14.5 0" stroke={AZUL} />
    </>
  ),
  tren: (
    <>
      <path d="M12 12h12l-2 14h-8Z" fill={TRAZO} />
      <rect x="6" y="25" width="32" height="24" rx="4" fill={AZUL} />
      <rect x="36" y="13" width="24" height="36" rx="3" fill={ROJO} />
      <path d="M33 8h30" strokeWidth="5" />
      <rect x="42" y="20" width="12" height="12" rx="2" fill={CELESTE} />
      <circle cx="16" cy="51" r="7" fill={TRAZO} />
      <circle cx="33" cy="51" r="7" fill={TRAZO} />
      <circle cx="50" cy="51" r="7" fill={TRAZO} />
      <circle cx="16" cy="51" r="2.5" fill={GRIS} stroke="none" />
      <circle cx="33" cy="51" r="2.5" fill={GRIS} stroke="none" />
      <circle cx="50" cy="51" r="2.5" fill={GRIS} stroke="none" />
      <path d="M2 60h60" />
    </>
  ),
  avion: (
    <>
      <path d="M10 28 4 11h9l11 17Z" fill={ROJO} />
      <path d="M3 34c0-4 4-6 8-6h37c5 0 11 3 13 7-2 4-8 6-13 6H11c-4 0-8-3-8-7Z" fill={PAPEL} />
      <path d="M50 29c3 0 7 2 9 5l-9 1Z" fill={CELESTE} strokeWidth="2.5" />
      <path d="M27 36h15L25 58h-9Z" fill={AZUL} />
      <path d="M17 33h.01M25 33h.01M33 33h.01M41 33h.01" strokeWidth="4" stroke={AZUL} />
    </>
  ),
  cubo: (
    <>
      <path d="M32 4 58 17 32 30 6 17Z" fill="#FFE27A" />
      <path d="M6 17 32 30v30L6 47Z" fill={AMARILLO} />
      <path d="M58 17 32 30v30l26-13Z" fill={NARANJA} />
    </>
  ),
  caja: (
    <>
      <path d="M10 26 3 13h22l7 13Z" fill={CREMA} />
      <path d="M54 26l7-13H39l-7 13Z" fill={CREMA} />
      <rect x="10" y="26" width="44" height="33" fill={MADERA} />
      <path d="M26 26h12v12H26Z" fill={CREMA} strokeWidth="2.5" />
    </>
  ),
  dado: (
    <>
      <rect x="7" y="7" width="50" height="50" rx="11" fill={PAPEL} />
      {[[20, 20], [44, 20], [32, 32], [20, 44], [44, 44]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill={ROJO} stroke="none" />
      ))}
    </>
  ),
  tijeras: (
    <>
      <path d="M23 45 47 3c3 13-2 26-14 41Z" fill={GRIS} />
      <path d="M41 45 17 3c-3 13 2 26 14 41Z" fill={GRIS} />
      <circle cx="19" cy="52" r="9" fill={ROJO} />
      <circle cx="45" cy="52" r="9" fill={ROJO} />
      <circle cx="19" cy="52" r="3.5" fill={PAPEL} />
      <circle cx="45" cy="52" r="3.5" fill={PAPEL} />
      <circle cx="32" cy="32" r="2.5" fill={TRAZO} stroke="none" />
    </>
  ),
  reloj: (
    <>
      <path d="M9 21a10 10 0 0 1 14-11ZM55 21a10 10 0 0 0-14-11Z" fill={AMARILLO} />
      <path d="M17 53l-5 8M47 53l5 8" strokeWidth="4" />
      <circle cx="32" cy="35" r="24" fill={ROJO} />
      <circle cx="32" cy="35" r="17" fill={PAPEL} />
      <path d="M32 35V23M32 35l8 5" />
      <path d="M32 21h.01M46 35h.01M32 49h.01M18 35h.01" strokeWidth="3.5" />
    </>
  ),
  lupa: (
    <>
      {conContorno("M41 41 57 57", 7, MARRON)}
      <circle cx="26" cy="26" r="21" fill={GRIS} />
      <circle cx="26" cy="26" r="15" fill={CELESTE} />
      <path d="M17 26c0-5 4-9 9-9" stroke={PAPEL} />
    </>
  ),
  jabon: (
    <>
      <circle cx="20" cy="15" r="7" fill={CELESTE} />
      <circle cx="36" cy="10" r="4.5" fill={CELESTE} />
      <circle cx="48" cy="19" r="5.5" fill={CELESTE} />
      <path d="M17 13c0-1 1-2 2-2" stroke={PAPEL} strokeWidth="2" />
      <rect x="5" y="28" width="54" height="30" rx="12" fill={ROSA} />
      <rect x="15" y="36" width="34" height="14" rx="7" fill="#FBC7DF" strokeWidth="2.5" />
    </>
  ),
  grifo: (
    <>
      <rect x="28" y="12" width="7" height="12" fill={GRIS} />
      <rect x="17" y="6" width="29" height="8" rx="4" fill={ROJO} />
      <path d="M8 23h29c10 0 16 6 16 15v5H40v-3c0-3-2-5-5-5H8Z" fill={GRIS} />
      <rect x="3" y="19" width="8" height="20" rx="2" fill={GRIS} />
      <path d="M46 48c-3 4-5 7-5 9a5 5 0 0 0 10 0c0-2-2-5-5-9Z" fill={AZUL} />
    </>
  ),
  cepillo: (
    <g transform="rotate(-20 32 32)">
      <path d="M38 36V22h22v14Z" fill={PAPEL} />
      <path d="M43 22v14M48 22v14M53 22v14" stroke={AZUL} strokeWidth="2" />
      <path d="M2 40c0-2 2-4 4-4h52c2 0 4 2 4 4s-2 5-4 5H24c-5 0-8-1-12-1H6c-2 0-4-2-4-4Z" fill={AZUL} />
    </g>
  ),
  huevo: (
    <>
      <path d="M32 4C21 4 10 23 10 38c0 13 9 22 22 22s22-9 22-22C54 23 43 4 32 4Z" fill={CREMA} />
      <path d="M19 37c0-7 3-13 7-18" stroke={PAPEL} strokeWidth="4" />
    </>
  ),
  uva: (
    <>
      <path d="M32 15V5" strokeWidth="4" />
      <path d="M34 11c4-6 12-7 18-3-3 7-12 9-18 3Z" fill={VERDE} />
      {[[13, 22], [26, 22], [39, 22], [52, 22], [19.5, 33], [32, 33], [45, 33], [26, 44], [39, 44], [32, 54]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="7.5" fill={MORADO} />
      ))}
    </>
  ),
  pan: (
    <>
      <path d="M5 30c0-13 12-18 27-18s27 5 27 18c0 4-2 7-5 8v14c0 3-2 5-5 5H15c-3 0-5-2-5-5V38c-3-1-5-4-5-8Z" fill={MADERA} />
      <path d="M21 21l-4 10M32 19v11M43 21l4 10" stroke={MARRON} strokeWidth="3.5" />
    </>
  ),
  mano: (
    <>
      <g strokeWidth="11">
        <path d="M24 34V10M33 34V6M42 34V10M50 38V19M15 42 7 28" />
      </g>
      <rect x="15" y="30" width="39" height="31" rx="13" fill={TRAZO} stroke="none" />
      <g stroke={PIEL} strokeWidth="5.5">
        <path d="M24 36V10M33 36V6M42 36V10M50 40V19M17 44 7 28" />
      </g>
      <rect x="18" y="33" width="33" height="25" rx="11" fill={PIEL} stroke="none" />
    </>
  ),
  ojo: (
    <>
      <path d="M12 16 7 10M23 11l-2-7M41 11l2-7M52 16l5-6" />
      <path d="M3 34c9-15 19-20 29-20s20 5 29 20c-9 15-19 20-29 20S12 49 3 34Z" fill={PAPEL} />
      <circle cx="32" cy="34" r="14" fill={AZUL} />
      <circle cx="32" cy="34" r="6.5" fill={TRAZO} stroke="none" />
      <circle cx="37" cy="29" r="3" fill={PAPEL} stroke="none" />
    </>
  ),
  dedo: (
    <g transform="rotate(90 32 32)">
      <path d="M24 40V7" strokeWidth="13" />
      <rect x="12" y="29" width="40" height="33" rx="12" fill={TRAZO} stroke="none" />
      <path d="M24 42V7" stroke={PIEL} strokeWidth="7" />
      <rect x="15" y="32" width="34" height="27" rx="9" fill={PIEL} stroke="none" />
      <rect x="21.5" y="4.5" width="5" height="7" rx="2" fill={PAPEL} strokeWidth="1.5" />
      <path d="M33 33v9M41 33v9" strokeWidth="2.5" />
      <path d="M15 46h16" strokeWidth="2.5" />
    </g>
  ),
};

function Dibujo({ objeto, x = 0, y = 0, escala = 1 }: { objeto: ObjetoId; x?: number; y?: number; escala?: number }) {
  return (
    <g
      className="ilu-dibujo"
      transform={`translate(${r2(x)} ${r2(y)}) scale(${escala})`}
      fill="none"
      stroke={TRAZO}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {OBJETO_DIBUJOS[objeto]}
    </g>
  );
}

function Txt({ x, y, tam = 16, ancla = "middle", peso = 600, children }: {
  x: number;
  y: number;
  tam?: number;
  ancla?: "start" | "middle" | "end";
  peso?: number;
  children: ReactNode;
}) {
  return (
    <text className="ilu-txt" x={r2(x)} y={r2(y)} fontSize={tam} fontWeight={peso} textAnchor={ancla} dominantBaseline="central" fill={TRAZO} stroke="none">
      {children}
    </text>
  );
}

const anchoTexto = (texto: string, tam: number): number => texto.length * tam * 0.66;

// Parte un texto en líneas de como mucho `maximo` caracteres, por los espacios.
function partir(texto: string, maximo: number): readonly string[] {
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of texto.trim().split(/\s+/)) {
    if (actual !== "" && actual.length + 1 + palabra.length > maximo) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = actual === "" ? palabra : `${actual} ${palabra}`;
    }
  }
  if (actual !== "") lineas.push(actual);
  return lineas;
}

type Tamano = "normal" | "opcion";

interface Comun {
  readonly decorativa: boolean;
  readonly tamano: Tamano;
}

type De<T extends Imagen["tipo"]> = Comun & { readonly imagen: Extract<Imagen, { tipo: T }> };

// La descripción accesible va en la lengua de la pregunta.
export const LenguaImagen = createContext<Lengua>("es");

function accesibilidad(imagen: Imagen, decorativa: boolean, lengua: Lengua) {
  return decorativa ? ({ "aria-hidden": "true" } as const) : ({ role: "img", "aria-label": describirImagen(imagen, lengua) } as const);
}

// Ancho máximo en unidades del viewBox; `opcion` es el que tiene dentro de un botón.
function Lienzo({ imagen, decorativa, tamano, ancho, alto, maximo = ancho, opcion = Math.min(maximo, 240), children }: Comun & {
  imagen: Imagen;
  ancho: number;
  alto: number;
  maximo?: number;
  opcion?: number;
  children: ReactNode;
}) {
  const lengua = useContext(LenguaImagen);
  const estilo = { "--ilu-ancho": `${r2((tamano === "opcion" ? opcion : maximo) / 16)}rem` } as CSSProperties;
  return (
    <svg
      className={`ilu ilu-svg ilu-${imagen.tipo} ilu-${tamano}`}
      viewBox={`0 0 ${r2(ancho)} ${r2(alto)}`}
      style={estilo}
      focusable="false"
      {...accesibilidad(imagen, decorativa, lengua)}
    >
      {children}
    </svg>
  );
}

// Una trama por color: dos colores nunca dependen solo del tono (daltonismo, alto contraste).
const COLOR_FORMA: Readonly<Record<ColorId, string>> = {
  rojo: "#E8483A",
  azul: "#2F8FE8",
  verde: "#3DB56B",
  amarillo: "#FFC629",
  morado: "#9261D6",
  naranja: "#F58A23",
};

const MARCA_TRAMA: Readonly<Record<ColorId, ReactNode>> = {
  rojo: null,
  azul: <path d="M0 5h10" />,
  verde: <circle cx="5" cy="5" r="1.8" fill={TRAZO} stroke="none" />,
  amarillo: <path d="M-2 2 2-2M0 10 10 0M8 12l4-4" />,
  morado: <path d="M0 5h10M5 0v10" />,
  naranja: <path d="M5 0v10" />,
};

function Tramas({ prefijo, colores }: { prefijo: string; colores: readonly ColorId[] }) {
  return (
    <defs>
      {[...new Set(colores)].map((color) => (
        <pattern key={color} id={`${prefijo}-${color}`} patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill={COLOR_FORMA[color]} />
          <g stroke={TRAZO} strokeOpacity="0.45" strokeWidth="1.6" fill="none">
            {MARCA_TRAMA[color]}
          </g>
        </pattern>
      ))}
    </defs>
  );
}

function Forma({ forma, relleno, x = 0 }: { forma: FormaId; relleno: string; x?: number }) {
  const comun = { fill: relleno, stroke: TRAZO, strokeWidth: 3, strokeLinejoin: "round" } as const;
  const dibujo: Readonly<Record<FormaId, ReactNode>> = {
    circulo: <circle cx="32" cy="32" r="28" {...comun} />,
    cuadrado: <rect x="6" y="6" width="52" height="52" rx="2" {...comun} />,
    triangulo: <polygon points="32,5 61,57 3,57" {...comun} />,
    rectangulo: <rect x="2" y="15" width="60" height="34" rx="2" {...comun} />,
    rombo: <polygon points="32,2 54,32 32,62 10,32" {...comun} />,
    pentagono: <polygon points={poligono(32, 34, 30, 5, -90)} {...comun} />,
    hexagono: <polygon points={poligono(32, 32, 30, 6, 0)} {...comun} />,
    ovalo: <ellipse cx="32" cy="32" rx="30" ry="19" {...comun} />,
    estrella: <polygon points={puntosEstrella(32, 34, 31, 13)} {...comun} />,
  };
  return <g transform={`translate(${r2(x)} 0)`}>{dibujo[forma]}</g>;
}

// useId puede traer caracteres que url(#…) no admite sin escapar.
function usePrefijo(): string {
  return `ilu${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

function VistaObjeto({ imagen, ...c }: De<"objeto">) {
  return (
    <Lienzo imagen={imagen} {...c} ancho={64} alto={64} maximo={176} opcion={112}>
      <Dibujo objeto={imagen.objeto} />
    </Lienzo>
  );
}

function VistaFigura({ imagen, ...c }: De<"figura">) {
  const prefijo = usePrefijo();
  return (
    <Lienzo imagen={imagen} {...c} ancho={64} alto={64} maximo={176} opcion={112}>
      <Tramas prefijo={prefijo} colores={[imagen.color]} />
      <Forma forma={imagen.forma} relleno={`url(#${prefijo}-${imagen.color})`} />
    </Lienzo>
  );
}

const CELDA = 72; // 64 del dibujo y 8 de separación
const POR_FILA = 5;
const ANCHO_LINEA = 780; // caben dos grupos llenos, uno al lado del otro

function VistaObjetos({ imagen, ...c }: De<"objetos">) {
  const enMarco = imagen.grupos.length > 1 || imagen.grupos.some((g) => g.etiqueta !== undefined);
  const margen = enMarco ? 12 : 0;
  const colocados: { readonly grupo: (typeof imagen.grupos)[number]; readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly arriba: number }[] = [];
  let x = 0;
  let y = 0;
  let altoLinea = 0;
  let ancho = 64;
  for (const grupo of imagen.grupos) {
    const columnas = Math.min(Math.max(grupo.cantidad, 1), POR_FILA);
    const filas = Math.max(Math.ceil(grupo.cantidad / POR_FILA), 1);
    const arriba = grupo.etiqueta === undefined ? 0 : 30;
    const w = Math.max(columnas * CELDA - 8, anchoTexto(grupo.etiqueta ?? "", 18)) + margen * 2;
    const h = filas * CELDA - 8 + arriba + margen * 2;
    if (x > 0 && x + w > ANCHO_LINEA) {
      x = 0;
      y += altoLinea + 16;
      altoLinea = 0;
    }
    colocados.push({ grupo, x, y, w, h, arriba });
    ancho = Math.max(ancho, x + w);
    altoLinea = Math.max(altoLinea, h);
    x += w + 16;
  }
  const alto = Math.max(y + altoLinea, 64);
  return (
    <Lienzo imagen={imagen} {...c} ancho={ancho + 2} alto={alto + 2}>
      {colocados.map(({ grupo, x: gx, y: gy, w, h, arriba }, g) => {
        const primerTachado = grupo.cantidad - Math.min(Math.max(grupo.tachados ?? 0, 0), grupo.cantidad);
        return (
          <g key={g} transform={`translate(${r2(gx + 1)} ${gy + 1})`}>
            {enMarco && <rect width={r2(w)} height={h} rx="14" fill={PAPEL} stroke={SUAVE} strokeWidth="2" />}
            {grupo.etiqueta !== undefined && <Txt x={w / 2} y={margen + 11} tam={18}>{grupo.etiqueta}</Txt>}
            {Array.from({ length: grupo.cantidad }, (_, i) => {
              const cx = margen + (i % POR_FILA) * CELDA;
              const cy = margen + arriba + Math.floor(i / POR_FILA) * CELDA;
              return (
                <g key={i}>
                  <Dibujo objeto={grupo.objeto} x={cx} y={cy} />
                  {i >= primerTachado && (
                    <g className="ilu-cruz" transform={`translate(${cx} ${cy})`} fill="none" strokeLinecap="round">
                      <path d="M8 8l48 48M56 8 8 56" stroke={PAPEL} strokeWidth="12" />
                      <path d="M8 8l48 48M56 8 8 56" stroke={CRUZ} strokeWidth="7" />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </Lienzo>
  );
}

function anchoElemento(e: ElementoSerie): number {
  return "texto" in e ? Math.max(64, anchoTexto(e.texto, 28) + 24) : 64;
}

function VistaSerie({ imagen, ...c }: De<"serie">) {
  const prefijo = usePrefijo();
  const colores = imagen.elementos.flatMap((e) => ("color" in e ? [e.color] : []));
  const GAP = 12;
  const elementos = imagen.elementos.reduce<readonly { readonly e: ElementoSerie; readonly x: number }[]>((lista, e) => {
    const ultimo = lista[lista.length - 1];
    return [...lista, { e, x: ultimo === undefined ? 2 : ultimo.x + anchoElemento(ultimo.e) + GAP }];
  }, []);
  const final = elementos[elementos.length - 1];
  const ancho = final === undefined ? 64 : final.x + anchoElemento(final.e) + 2;
  return (
    <Lienzo imagen={imagen} {...c} ancho={ancho} alto={68}>
      <Tramas prefijo={prefijo} colores={colores} />
      {elementos.map(({ e, x }, i) => {
        if ("hueco" in e) {
          return (
            <g key={i} className="ilu-hueco">
              <rect x={x} y="3" width="62" height="62" rx="12" fill={PAPEL} stroke={TRAZO} strokeWidth="3" strokeDasharray="7 7" strokeLinecap="round" />
              <Txt x={x + 31} y={34} tam={36} peso={700}>?</Txt>
            </g>
          );
        }
        if ("texto" in e) {
          const w = anchoElemento(e);
          return (
            <g key={i}>
              <rect x={r2(x)} y="3" width={r2(w)} height="62" rx="12" fill={PAPEL} stroke={TRAZO} strokeWidth="3" />
              <Txt x={x + w / 2} y={34} tam={28}>{e.texto}</Txt>
            </g>
          );
        }
        if ("objeto" in e) return <Dibujo key={i} objeto={e.objeto} x={x} y={2} />;
        return (
          <g key={i} transform="translate(0 2)">
            <Forma forma={e.forma} relleno={`url(#${prefijo}-${e.color})`} x={x} />
          </g>
        );
      })}
    </Lienzo>
  );
}

function VistaMonedas({ imagen, ...c }: De<"monedas">) {
  const n = imagen.valores.length;
  const columnas = Math.min(Math.max(n, 1), POR_FILA);
  const filas = Math.max(Math.ceil(n / POR_FILA), 1);
  return (
    <Lienzo imagen={imagen} {...c} ancho={columnas * CELDA - 4} alto={filas * CELDA - 4} maximo={columnas * CELDA * 1.2} opcion={Math.min(columnas * CELDA, 256)}>
      {imagen.valores.map((valor, i) => {
        const cx = 34 + (i % POR_FILA) * CELDA;
        const cy = 34 + Math.floor(i / POR_FILA) * CELDA;
        const texto = numeroEnTexto(valor);
        const tam = texto.length <= 2 ? 28 : texto.length === 3 ? 22 : 17;
        return (
          <g key={i} className="ilu-moneda">
            <circle cx={cx} cy={cy} r="31" fill={AMARILLO} stroke={TRAZO} strokeWidth="3" />
            <circle cx={cx} cy={cy} r="25" fill="none" stroke="#C98A00" strokeWidth="2.5" />
            <Txt x={cx} y={cy + 1} tam={tam} peso={700}>{texto}</Txt>
          </g>
        );
      })}
    </Lienzo>
  );
}

function VistaReloj({ imagen, ...c }: De<"reloj">) {
  const hora = ((imagen.hora % 12) + 12) % 12;
  const minuto = ((imagen.minuto % 60) + 60) % 60;
  const anguloHora = (hora + minuto / 60) * 30 - 90;
  const anguloMinuto = minuto * 6 - 90;
  const [hx, hy] = polar(120, 120, 40, anguloHora);
  const [mx, my] = polar(120, 120, 62, anguloMinuto);
  return (
    <Lienzo imagen={imagen} {...c} ancho={240} alto={240} maximo={288} opcion={176}>
      <circle cx="120" cy="120" r="114" fill={PAPEL} stroke={TRAZO} strokeWidth="7" />
      {Array.from({ length: 60 }, (_, i) => {
        const grande = i % 5 === 0;
        const [x1, y1] = polar(120, 120, grande ? 96 : 101, i * 6 - 90);
        const [x2, y2] = polar(120, 120, 107, i * 6 - 90);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={TRAZO} strokeWidth={grande ? 4 : 2} strokeLinecap="round" />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const [x, y] = polar(120, 120, 78, (i + 1) * 30 - 90);
        return <Txt key={i} x={x} y={y + 1} tam={24} peso={700}>{i + 1}</Txt>;
      })}
      <line className="ilu-aguja-larga" x1="120" y1="120" x2={mx} y2={my} stroke={ROJO} strokeWidth="7" strokeLinecap="round" />
      <line className="ilu-aguja-corta" x1="120" y1="120" x2={hx} y2={hy} stroke={TRAZO} strokeWidth="12" strokeLinecap="round" />
      <circle cx="120" cy="120" r="9" fill={AMARILLO} stroke={TRAZO} strokeWidth="3" />
    </Lienzo>
  );
}

const CUBITO = 16;

function rejilla(columnas: number, filas: number): string {
  const verticales = Array.from({ length: columnas - 1 }, (_, i) => `M${(i + 1) * CUBITO} 0v${filas * CUBITO}`);
  const horizontales = Array.from({ length: filas - 1 }, (_, i) => `M0 ${(i + 1) * CUBITO}h${columnas * CUBITO}`);
  return [...verticales, ...horizontales].join("");
}

function Bloque({ x, y, columnas, filas, color, clase }: { x: number; y: number; columnas: number; filas: number; color: string; clase: string }) {
  return (
    <g className={clase} transform={`translate(${x} ${y})`}>
      <rect width={columnas * CUBITO} height={filas * CUBITO} rx="2" fill={color} stroke={TRAZO} strokeWidth="2.5" />
      {(columnas > 1 || filas > 1) && <path d={rejilla(columnas, filas)} stroke={TRAZO} strokeWidth="1.2" fill="none" />}
    </g>
  );
}

function VistaDecenas({ imagen, ...c }: De<"decenas">) {
  const LADO = CUBITO * 10;
  const POR_COLUMNA = 5;
  const columnasCubos = Math.ceil(imagen.unidades / POR_COLUMNA);
  const filasCubos = Math.min(imagen.unidades, POR_COLUMNA);
  const piezas: { readonly tipo: "placa" | "barra" | "cubos"; readonly w: number; readonly h: number; readonly gap: number }[] = [
    ...Array.from({ length: imagen.centenas ?? 0 }, () => ({ tipo: "placa" as const, w: LADO, h: LADO, gap: 14 })),
    ...Array.from({ length: imagen.decenas }, () => ({ tipo: "barra" as const, w: CUBITO, h: LADO, gap: 9 })),
  ];
  if (imagen.unidades > 0) {
    piezas.push({ tipo: "cubos", w: columnasCubos * (CUBITO + 5) - 5, h: filasCubos * (CUBITO + 5) - 5, gap: 0 });
  }
  const lineas: { readonly pieza: (typeof piezas)[number]; readonly x: number }[][] = [[]];
  let x = 2;
  let anterior: (typeof piezas)[number]["tipo"] | undefined;
  let ancho = 64;
  for (const pieza of piezas) {
    if (anterior !== undefined && anterior !== pieza.tipo) x += 16;
    if (x > 2 && x + pieza.w > ANCHO_LINEA) {
      lineas.push([]);
      x = 2;
    }
    lineas[lineas.length - 1]?.push({ pieza, x });
    ancho = Math.max(ancho, x + pieza.w + 2);
    x += pieza.w + pieza.gap;
    anterior = pieza.tipo;
  }
  const altos = lineas.map((l) => Math.max(0, ...l.map(({ pieza }) => pieza.h)));
  const alto = Math.max(altos.reduce((suma, h) => suma + h + 14, 0) - 14 + 4, 24);
  let y = 2;
  return (
    <Lienzo imagen={imagen} {...c} ancho={ancho} alto={alto} opcion={Math.min(ancho, 256)}>
      {lineas.map((linea, l) => {
        const altoLinea = altos[l] ?? 0;
        const arriba = y;
        y += altoLinea + 14;
        return linea.map(({ pieza, x: px }, i) => {
          const py = arriba + altoLinea - pieza.h; // todas apoyadas en la misma base
          if (pieza.tipo === "placa") return <Bloque key={`${l}-${i}`} x={px} y={py} columnas={10} filas={10} color={AZUL} clase="ilu-placa" />;
          if (pieza.tipo === "barra") return <Bloque key={`${l}-${i}`} x={px} y={py} columnas={1} filas={10} color={AMARILLO} clase="ilu-barra" />;
          return (
            <g key={`${l}-${i}`}>
              {Array.from({ length: imagen.unidades }, (_, u) => (
                <Bloque
                  key={u}
                  x={px + Math.floor(u / POR_COLUMNA) * (CUBITO + 5)}
                  y={py + pieza.h - CUBITO - (u % POR_COLUMNA) * (CUBITO + 5)}
                  columnas={1}
                  filas={1}
                  color={NARANJA}
                  clase="ilu-cubito"
                />
              ))}
            </g>
          );
        });
      })}
    </Lienzo>
  );
}

function VistaFraccion({ imagen, ...c }: De<"fraccion">) {
  const partes = Math.max(Math.trunc(imagen.partes), 1);
  const relleno = (i: number): string => (i < imagen.coloreadas ? NARANJA : PAPEL);
  if (imagen.forma === "barra") {
    const w = 352 / partes;
    return (
      <Lienzo imagen={imagen} {...c} ancho={360} alto={84} maximo={420} opcion={240}>
        {Array.from({ length: partes }, (_, i) => (
          <rect key={i} className="ilu-parte" x={r2(4 + i * w)} y="4" width={r2(w)} height="76" fill={relleno(i)} stroke={TRAZO} strokeWidth="3.5" />
        ))}
      </Lienzo>
    );
  }
  return (
    <Lienzo imagen={imagen} {...c} ancho={200} alto={200} maximo={240} opcion={160}>
      {partes === 1 ? (
        <circle className="ilu-parte" cx="100" cy="100" r="94" fill={relleno(0)} stroke={TRAZO} strokeWidth="4" />
      ) : (
        Array.from({ length: partes }, (_, i) => {
          const [x1, y1] = polar(100, 100, 94, -90 + (360 / partes) * i);
          const [x2, y2] = polar(100, 100, 94, -90 + (360 / partes) * (i + 1));
          return <path key={i} className="ilu-parte" d={`M100 100L${x1} ${y1}A94 94 0 0 1 ${x2} ${y2}Z`} fill={relleno(i)} stroke={TRAZO} strokeWidth="4" strokeLinejoin="round" />;
        })
      )}
    </Lienzo>
  );
}

// Paso de la rejilla: todos los valores caen en una línea, con un número de líneas cómodo.
function escalaEje(valores: readonly number[]): { readonly paso: number; readonly tope: number } {
  const maximo = Math.max(0, ...valores);
  if (maximo <= 0) return { paso: 1, tope: 1 };
  const candidatos = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7].flatMap((e) => [1, 2, 5, 25].map((b) => b * 10 ** e)).sort((a, b) => a - b);
  const lineas = (p: number): number => Math.ceil(maximo / p - 1e-9);
  const divide = (p: number): boolean => valores.every((v) => Math.abs(v / p - Math.round(v / p)) < 1e-9);
  const validos = candidatos.filter((p) => lineas(p) <= 24 && divide(p));
  const paso = validos.filter((p) => lineas(p) >= 4).at(-1) ?? validos.at(0) ?? candidatos.find((p) => lineas(p) <= 24) ?? maximo;
  return { paso, tope: lineas(paso) * paso };
}

function VistaBarras({ imagen, ...c }: De<"barras">) {
  const valores = imagen.etiquetas.map((_, i) => Math.max(imagen.valores[i] ?? 0, 0));
  const escala = escalaEje(valores);
  const { paso } = escala;
  // Con muchas líneas se numera una sí y otra no, para que los números no se pisen.
  const salto = escala.tope / paso > 16 ? 2 : 1;
  const marcas = Math.ceil(escala.tope / paso / salto - 1e-9) * salto;
  const tope = marcas * paso;
  const palabraLarga = Math.max(4, ...imagen.etiquetas.flatMap((e) => e.split(/\s+/).map((p) => p.length)));
  const columna = Math.max(84, palabraLarga * 9.6 + 14);
  const eje = anchoTexto(numeroEnTexto(tope), 16) + 18;
  const ancho = Math.max(eje + Math.max(valores.length, 1) * columna + 14, 320);
  const titulo = partir(imagen.titulo, Math.floor(ancho / 12.5));
  const arriba = titulo.length * 25 + 14;
  const ALTO = Math.max(240, marcas * (salto === 1 ? 20 : 14));
  const rotulos = imagen.etiquetas.map((e) => partir(e, Math.floor((columna - 6) / 9.6)));
  const lineasRotulo = Math.max(1, ...rotulos.map((r) => r.length));
  const base = arriba + ALTO;
  const yDe = (v: number): number => base - (v / tope) * ALTO;
  return (
    <Lienzo imagen={imagen} {...c} ancho={ancho} alto={base + 12 + lineasRotulo * 20} opcion={Math.min(ancho, 320)}>
      {titulo.map((linea, i) => (
        <Txt key={i} x={ancho / 2} y={13 + i * 25} tam={20} peso={700}>{linea}</Txt>
      ))}
      {Array.from({ length: marcas + 1 }, (_, i) => {
        const y = yDe(i * paso);
        return (
          <g key={i} className="ilu-rejilla">
            <line x1={eje} y1={r2(y)} x2={ancho - 6} y2={r2(y)} stroke={SUAVE} strokeWidth="2" />
            <line x1={eje - 6} y1={r2(y)} x2={eje} y2={r2(y)} stroke={TRAZO} strokeWidth="2.5" />
            {i % salto === 0 && <Txt x={eje - 10} y={y} tam={16} ancla="end">{numeroEnTexto(i * paso)}</Txt>}
          </g>
        );
      })}
      {valores.map((v, i) => (
        <rect
          key={i}
          className="ilu-barra-dato"
          x={r2(eje + i * columna + columna * 0.18)}
          y={r2(yDe(v))}
          width={r2(columna * 0.64)}
          height={r2(base - yDe(v))}
          fill={AZUL}
          stroke={TRAZO}
          strokeWidth="3"
        />
      ))}
      <path d={`M${r2(eje)} ${arriba - 6}V${base}H${r2(ancho - 6)}`} fill="none" stroke={TRAZO} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {rotulos.map((lineas, i) =>
        lineas.map((linea, l) => (
          <Txt key={`${i}-${l}`} x={eje + i * columna + columna / 2} y={base + 14 + l * 20} tam={16}>{linea}</Txt>
        )),
      )}
    </Lienzo>
  );
}

function VistaRectangulo({ imagen, ...c }: De<"rectangulo">) {
  const razon = Math.max(imagen.ancho, 1e-6) / Math.max(imagen.alto, 1e-6);
  const lado = c.tamano === "opcion" ? 130 : 260; // en un botón, más texto en proporción
  const w = razon >= 1 ? lado : Math.max(lado * 0.27, lado * 0.8 * razon);
  const h = razon >= 1 ? Math.max(lado * 0.27, lado / razon) : lado * 0.8;
  const rotuloAlto = `${numeroEnTexto(imagen.alto)} ${imagen.unidad}`;
  const rotuloAncho = `${numeroEnTexto(imagen.ancho)} ${imagen.unidad}`;
  const izquierda = anchoTexto(rotuloAlto, 18) + 26;
  const arriba = 44;
  const ancho = Math.max(izquierda + w + 8, izquierda + w / 2 + anchoTexto(rotuloAncho, 18) / 2 + 6);
  const cota = { stroke: TRAZO, strokeWidth: 2.5, strokeLinecap: "round", fill: "none" } as const;
  return (
    <Lienzo imagen={imagen} {...c} ancho={ancho} alto={arriba + h + 6} opcion={Math.min(ancho, 256)}>
      <Txt x={izquierda + w / 2} y={12} tam={18} peso={700}>{rotuloAncho}</Txt>
      <path d={`M${r2(izquierda)} 26v10M${r2(izquierda)} 31h${r2(w)}M${r2(izquierda + w)} 26v10`} {...cota} />
      <Txt x={izquierda - 20} y={arriba + h / 2} tam={18} peso={700} ancla="end">{rotuloAlto}</Txt>
      <path d={`M${r2(izquierda - 18)} ${arriba}h10M${r2(izquierda - 13)} ${arriba}v${r2(h)}M${r2(izquierda - 18)} ${r2(arriba + h)}h10`} {...cota} />
      <rect x={r2(izquierda)} y={arriba} width={r2(w)} height={r2(h)} rx="2" fill="#FFE27A" stroke={TRAZO} strokeWidth="3.5" />
    </Lienzo>
  );
}

function VistaRecta({ imagen, ...c }: De<"recta">) {
  const ANCHO = 680;
  const X0 = 40;
  const X1 = ANCHO - 40;
  const Y = 62;
  const rango = imagen.hasta - imagen.desde;
  const valido = imagen.paso > 0 && rango > 0;
  const pasos = valido ? Math.min(Math.floor(rango / imagen.paso + 1e-9), 200) : 0;
  const xDe = (v: number): number => (valido ? X0 + ((v - imagen.desde) / rango) * (X1 - X0) : X0);
  const textos = Array.from({ length: pasos + 1 }, (_, i) => numeroEnTexto(imagen.desde + i * imagen.paso));
  const anchoRotulo = Math.max(...textos.map((t) => anchoTexto(t, 18))) + 10;
  const caben = Math.max(Math.floor((X1 - X0) / anchoRotulo), 1);
  const salto = [1, 2, 5, 10, 20, 25, 50, 100, 200].find((k) => Math.ceil((pasos + 1) / k) <= caben) ?? 200;
  const marca = imagen.marca === undefined ? undefined : xDe(Math.min(Math.max(imagen.marca, imagen.desde), imagen.hasta));
  return (
    <Lienzo imagen={imagen} {...c} ancho={ANCHO} alto={112} opcion={320}>
      <path d={`M10 ${Y}H${ANCHO - 10}M20 ${Y - 8}l-10 8 10 8M${ANCHO - 20} ${Y - 8}l10 8-10 8`} fill="none" stroke={TRAZO} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {textos.map((texto, i) => {
        const x = xDe(imagen.desde + i * imagen.paso);
        const rotulado = i % salto === 0;
        return (
          <g key={i}>
            <line x1={r2(x)} y1={Y - (rotulado ? 11 : 7)} x2={r2(x)} y2={Y + (rotulado ? 11 : 7)} stroke={TRAZO} strokeWidth={rotulado ? 3.5 : 2.5} strokeLinecap="round" />
            {rotulado && <Txt x={x} y={Y + 31} tam={18} peso={700}>{texto}</Txt>}
          </g>
        );
      })}
      {marca !== undefined && (
        <path className="ilu-marca" d={`M${r2(marca)} ${Y - 13}l-13-24h26Z`} fill={CRUZ} stroke={TRAZO} strokeWidth="3" strokeLinejoin="round" />
      )}
    </Lienzo>
  );
}

const COLORES_TIRA = [AZUL, NARANJA, VERDE, MORADO, AMARILLO, ROJO] as const;

function VistaTiras({ imagen, ...c }: De<"tiras">) {
  const ANCHO = 640;
  const FILA = 56;
  const rotulo = Math.max(30, ...imagen.tiras.map((t) => anchoTexto(t.etiqueta, 18))) + 12;
  const mayor = Math.max(1e-6, ...imagen.tiras.map((t) => t.largo));
  const unidad = (ANCHO - rotulo - 8) / mayor;
  const alto = Math.max(imagen.tiras.length, 1) * FILA + 4;
  return (
    <Lienzo imagen={imagen} {...c} ancho={ANCHO} alto={alto} opcion={320}>
      {imagen.tiras.map((tira, i) => {
        const y = 6 + i * FILA;
        const w = Math.max(tira.largo, 0) * unidad;
        const divisiones = Number.isInteger(tira.largo) && Number.isInteger(mayor) && mayor <= 30 ? tira.largo - 1 : 0;
        return (
          <g key={i} className="ilu-tira">
            <Txt x={rotulo - 12} y={y + 22} tam={18} peso={700} ancla="end">{tira.etiqueta}</Txt>
            <rect x={rotulo} y={y} width={r2(w)} height="44" rx="5" fill={COLORES_TIRA[i % COLORES_TIRA.length]} stroke={TRAZO} strokeWidth="3" />
            {Array.from({ length: Math.max(divisiones, 0) }, (_, d) => (
              <line key={d} x1={r2(rotulo + (d + 1) * unidad)} y1={y + 2} x2={r2(rotulo + (d + 1) * unidad)} y2={y + 42} stroke={TRAZO} strokeWidth="1.5" strokeOpacity="0.55" />
            ))}
          </g>
        );
      })}
      <line x1={rotulo} y1="2" x2={rotulo} y2={alto - 2} stroke={TRAZO} strokeWidth="3" strokeLinecap="round" />
    </Lienzo>
  );
}

function Platillo({ cx, cy, objeto }: { cx: number; cy: number; objeto: ObjetoId }) {
  const plato = cy + 96;
  return (
    <g className="ilu-platillo">
      <path d={`M${r2(cx)} ${r2(cy)}L${r2(cx - 48)} ${r2(plato)}M${r2(cx)} ${r2(cy)}L${r2(cx + 48)} ${r2(plato)}`} fill="none" stroke={TRAZO} strokeWidth="2.5" strokeLinecap="round" />
      <Dibujo objeto={objeto} x={cx - 30} y={plato - 58} escala={0.94} />
      <path d={`M${r2(cx - 52)} ${r2(plato)}h104c-8 16-24 19-52 19s-44-3-52-19Z`} fill={GRIS} stroke={TRAZO} strokeWidth="3" strokeLinejoin="round" />
    </g>
  );
}

function VistaBalanza({ imagen, ...c }: De<"balanza">) {
  const CX = 180;
  const CY = 34;
  const BRAZO = 116;
  const giro = imagen.baja === "ninguna" ? 0 : imagen.baja === "izquierda" ? -11 : 11;
  const [xd, yd] = polar(CX, CY, BRAZO, giro);
  const [xi, yi] = polar(CX, CY, BRAZO, 180 + giro);
  return (
    <Lienzo imagen={imagen} {...c} ancho={360} alto={236} maximo={420} opcion={256}>
      <rect x={CX - 6} y={CY} width="12" height="184" fill={MADERA} stroke={TRAZO} strokeWidth="3" />
      <rect x={CX - 62} y="216" width="124" height="16" rx="6" fill={MARRON} stroke={TRAZO} strokeWidth="3" />
      <Platillo cx={xi} cy={yi} objeto={imagen.izquierda} />
      <Platillo cx={xd} cy={yd} objeto={imagen.derecha} />
      <rect className="ilu-brazo" x={CX - BRAZO - 6} y={CY - 6} width={BRAZO * 2 + 12} height="12" rx="6" fill={AMARILLO} stroke={TRAZO} strokeWidth="3" transform={`rotate(${giro} ${CX} ${CY})`} />
      <circle cx={CX} cy={CY} r="10" fill={ROJO} stroke={TRAZO} strokeWidth="3" />
    </Lienzo>
  );
}

function VistaTabla({ imagen, decorativa, tamano }: De<"tabla">) {
  return (
    <div className={`ilu ilu-tabla-marco ilu-${tamano}`} {...(decorativa ? { "aria-hidden": "true" } : {})}>
      <table className="ilu-tabla">
        <caption className={imagen.titulo === undefined ? "ilu-solo-lector" : "ilu-tabla-titulo"}>{imagen.titulo ?? "Tabla"}</caption>
        <thead>
          <tr>
            {imagen.cabeceras.map((cabecera, i) => (
              <th key={i} scope="col">{cabecera}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {imagen.filas.map((fila, i) => (
            <tr key={i}>
              {fila.map((celda, j) => (j === 0 ? <th key={j} scope="row">{celda}</th> : <td key={j}>{celda}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// "Lunes: 9:00" se pinta en dos columnas en horarios y recibos. Una frase larga con dos
// puntos, no: se queda en una sola pieza y se ajusta al ancho.
function LineaEnColumnas({ linea }: { linea: string }) {
  const corte = linea.indexOf(": ");
  if (corte < 0 || corte > 28 || linea.length - corte - 2 > 24) return <span>{linea}</span>;
  return (
    <>
      <span>{linea.slice(0, corte)}</span>
      <span className="ilu-cartel-dato">{linea.slice(corte + 2)}</span>
    </>
  );
}

function VistaCartel({ imagen, decorativa, tamano }: De<"cartel">) {
  const enColumnas = imagen.estilo === "horario" || imagen.estilo === "recibo";
  const enParrafos = imagen.estilo === "aviso" || imagen.estilo === "nota" || imagen.estilo === "etiqueta";
  return (
    <figure className={`ilu ilu-cartel ilu-cartel-${imagen.estilo} ilu-${tamano}`} {...(decorativa ? { "aria-hidden": "true" } : {})}>
      <figcaption className="ilu-cartel-titulo">
        {imagen.estilo === "aviso" && (
          <svg className="ilu-cartel-icono" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path d="M16 4 30 28H2Z" fill={AMARILLO} stroke={TRAZO} strokeWidth="3" strokeLinejoin="round" />
            <path d="M16 13v7M16 24v.1" stroke={TRAZO} strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        )}
        {imagen.titulo}
      </figcaption>
      {enParrafos ? (
        <div className="ilu-cartel-lineas">
          {imagen.lineas.map((linea, i) => (
            <p key={i}>{linea}</p>
          ))}
        </div>
      ) : (
        <ul className="ilu-cartel-lineas">
          {imagen.lineas.map((linea, i) => (
            <li key={i} className={/^total\b/i.test(linea) ? "ilu-cartel-total" : undefined}>
              {enColumnas ? <LineaEnColumnas linea={linea} /> : linea}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

export function Ilustracion({ imagen, decorativa = false, tamano = "normal" }: { imagen: Imagen; decorativa?: boolean; tamano?: Tamano }) {
  const c = { decorativa, tamano };
  switch (imagen.tipo) {
    case "objetos": return <VistaObjetos imagen={imagen} {...c} />;
    case "objeto": return <VistaObjeto imagen={imagen} {...c} />;
    case "figura": return <VistaFigura imagen={imagen} {...c} />;
    case "serie": return <VistaSerie imagen={imagen} {...c} />;
    case "monedas": return <VistaMonedas imagen={imagen} {...c} />;
    case "reloj": return <VistaReloj imagen={imagen} {...c} />;
    case "decenas": return <VistaDecenas imagen={imagen} {...c} />;
    case "fraccion": return <VistaFraccion imagen={imagen} {...c} />;
    case "barras": return <VistaBarras imagen={imagen} {...c} />;
    case "tabla": return <VistaTabla imagen={imagen} {...c} />;
    case "rectangulo": return <VistaRectangulo imagen={imagen} {...c} />;
    case "recta": return <VistaRecta imagen={imagen} {...c} />;
    case "tiras": return <VistaTiras imagen={imagen} {...c} />;
    case "balanza": return <VistaBalanza imagen={imagen} {...c} />;
    case "cartel": return <VistaCartel imagen={imagen} {...c} />;
  }
}
