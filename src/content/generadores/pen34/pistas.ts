// Propiedades de números que se usan como frases y como pistas. Cada una sabe comprobarse.
export interface Propiedad {
  readonly texto: string; // "es par", sin sujeto ni punto
  readonly cumple: (n: number) => boolean;
}

export const esPar: Propiedad = { texto: "es par", cumple: (n) => n % 2 === 0 };
export const esImpar: Propiedad = { texto: "es impar", cumple: (n) => n % 2 === 1 };
export const mayorQue = (m: number): Propiedad => ({ texto: `es mayor que ${m}`, cumple: (n) => n > m });
export const menorQue = (m: number): Propiedad => ({ texto: `es menor que ${m}`, cumple: (n) => n < m });
export const terminaEn = (c: number): Propiedad => ({ texto: `termina en ${c}`, cumple: (n) => n % 10 === c });
export const tablaDel = (k: number): Propiedad => ({ texto: `está en la tabla del ${k}`, cumple: (n) => n % k === 0 });
export const cifrasSuman = (s: number): Propiedad => ({
  texto: `sus cifras suman ${s}`,
  cumple: (n) => [...String(n)].reduce((t, c) => t + Number(c), 0) === s,
});
export const negar = (p: Propiedad): Propiedad => ({ texto: `no ${p.texto}`, cumple: (n) => !p.cumple(n) });

// Todas las propiedades que se pueden decir de un número de dos cifras, verdaderas o no.
export function propiedadesPosibles(avanzadas: boolean): Propiedad[] {
  const umbrales = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
  const salida: Propiedad[] = [esPar, esImpar];
  for (const m of umbrales) salida.push(mayorQue(m), menorQue(m));
  for (let c = 0; c <= 9; c += 1) salida.push(terminaEn(c));
  if (avanzadas) {
    for (const k of [3, 4, 5]) salida.push(tablaDel(k));
    for (let s = 3; s <= 12; s += 1) salida.push(cifrasSuman(s));
  }
  return salida;
}
