// PIN del profesor: 4 dígitos, guardado con hash SHA-256. Es una barrera local: sin
// servidor no es seguridad fuerte (documentado en "Acerca de" y en el README).

const PREFIJO = "radar-pin:";

export function pinValido(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Web Crypto solo existe en contextos seguros. En una tablet que abra la app por
// http en la red local no estaría, y el profesor no podría entrar: de ahí esta alternativa.
function sha256Manual(mensaje: Uint8Array): Uint8Array {
  const K: number[] = [];
  const H: number[] = [];
  const fraccion = (x: number) => ((x - Math.floor(x)) * 2 ** 32) | 0;
  for (let n = 2; K.length < 64; n += 1) {
    let primo = true;
    for (let d = 2; d * d <= n; d += 1) if (n % d === 0) primo = false;
    if (primo) {
      if (H.length < 8) H.push(fraccion(n ** (1 / 2)));
      K.push(fraccion(n ** (1 / 3)));
    }
  }
  const largo = mensaje.length;
  const total = Math.ceil((largo + 9) / 64) * 64;
  const datos = new Uint8Array(total);
  datos.set(mensaje);
  datos[largo] = 0x80;
  new DataView(datos.buffer).setUint32(total - 4, largo * 8);
  const rotar = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  const vista = new DataView(datos.buffer);
  for (let bloque = 0; bloque < total; bloque += 64) {
    const w = new Array<number>(64).fill(0);
    for (let i = 0; i < 16; i += 1) w[i] = vista.getInt32(bloque + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const a = w[i - 15] as number;
      const b = w[i - 2] as number;
      const s0 = rotar(a, 7) ^ rotar(a, 18) ^ (a >>> 3);
      const s1 = rotar(b, 17) ^ rotar(b, 19) ^ (b >>> 10);
      w[i] = ((w[i - 16] as number) + s0 + (w[i - 7] as number) + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H as [number, number, number, number, number, number, number, number];
    for (let i = 0; i < 64; i += 1) {
      const t1 = (h + (rotar(e, 6) ^ rotar(e, 11) ^ rotar(e, 25)) + ((e & f) ^ (~e & g)) + (K[i] as number) + (w[i] as number)) | 0;
      const t2 = ((rotar(a, 2) ^ rotar(a, 13) ^ rotar(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, h].forEach((v, i) => {
      H[i] = ((H[i] as number) + v) | 0;
    });
  }
  const salida = new Uint8Array(32);
  H.forEach((v, i) => new DataView(salida.buffer).setInt32(i * 4, v));
  return salida;
}

export async function hashPin(pin: string): Promise<string> {
  const datos = new TextEncoder().encode(`${PREFIJO}${pin}`);
  const sutil = globalThis.crypto?.subtle;
  if (sutil === undefined) return hex(sha256Manual(datos));
  return hex(new Uint8Array(await sutil.digest("SHA-256", datos)));
}

export function hashPinSinCrypto(pin: string): string {
  return hex(sha256Manual(new TextEncoder().encode(`${PREFIJO}${pin}`)));
}

export async function comprobarPin(pin: string, guardado: string | null): Promise<boolean> {
  return guardado !== null && pinValido(pin) && (await hashPin(pin)) === guardado;
}
