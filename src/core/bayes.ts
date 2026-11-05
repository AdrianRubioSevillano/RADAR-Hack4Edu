// Inferencia bayesiana exacta sobre la conjunta de 2^K estados.
import { assertItem, assertK, mascara, numeroEstados, probabilidadRespuesta } from "./dina.ts";
import { MotorError, type Conjunta, type Item } from "./tipos.ts";

// SUPUESTO: probabilidad a priori de dominar cada habilidad. No calibrada.
export const P0_DEFECTO = 0.5;
// SUPUESTO: peso de los estados incompatibles con el orden de prerrequisitos. No calibrado.
export const EPSILON_DEFECTO = 0.1;
// SUPUESTO: probabilidad de que la práctica haga dominar una habilidad no dominada. No calibrada.
export const APRENDIZAJE_DEFECTO = 0.5;

const MASA_MINIMA = 1e-300;

function normalizar(pesos: readonly number[]): Conjunta {
  const total = pesos.reduce((suma, peso) => suma + peso, 0);
  if (!Number.isFinite(total) || total < MASA_MINIMA) {
    throw new MotorError("NORMALIZACION_INVALIDA", `Masa total no normalizable: ${String(total)}`);
  }
  return pesos.map((peso) => peso / total);
}

// Las habilidades forman una cadena 0 → 1 → 2…: un estado es compatible si los bits
// dominados son un prefijo (domina k solo si domina todas las anteriores).
export function esCompatible(estado: number): boolean {
  return (estado & (estado + 1)) === 0;
}

export interface OpcionesPrior {
  readonly p0?: number;
  readonly epsilon?: number; // 1 equivale al prior independiente
}

export function crearPrior(k: number, opciones: OpcionesPrior = {}): Conjunta {
  assertK(k);
  const p0 = opciones.p0 ?? P0_DEFECTO;
  const epsilon = opciones.epsilon ?? EPSILON_DEFECTO;
  if (!Number.isFinite(p0) || p0 < 0 || p0 > 1) throw new MotorError("PRIOR_INVALIDO", "p0 debe estar en [0, 1]");
  if (!Number.isFinite(epsilon) || epsilon <= 0 || epsilon > 1) throw new MotorError("PRIOR_INVALIDO", "epsilon debe estar en (0, 1]");
  const pesos = Array.from({ length: numeroEstados(k) }, (_, estado) => {
    let masa = 1;
    for (let h = 0; h < k; h += 1) masa *= (estado >> h) & 1 ? p0 : 1 - p0;
    return esCompatible(estado) ? masa : masa * epsilon;
  });
  return normalizar(pesos);
}

function kDe(conjunta: Conjunta): number {
  const k = Math.log2(conjunta.length);
  if (!Number.isInteger(k)) throw new MotorError("CONJUNTA_INVALIDA", "La conjunta debe tener 2^K masas");
  return k;
}

// π'(α) ∝ π(α) · P(Y = r | α).
export function actualizar(conjunta: Conjunta, item: Item, acierto: boolean): Conjunta {
  assertItem(item, kDe(conjunta));
  const mask = mascara(item.requiere);
  return normalizar(conjunta.map((masa, estado) => masa * probabilidadRespuesta(estado, mask, item.slip, item.guess, acierto)));
}

// P(dominio_k) = Σ_α π(α)·α_k.
export function marginales(conjunta: Conjunta): readonly number[] {
  const k = kDe(conjunta);
  return Array.from({ length: k }, (_, h) => conjunta.reduce((suma, masa, estado) => suma + ((estado >> h) & 1 ? masa : 0), 0));
}

// Tras practicar, cada estado sin la habilidad h pasa a tenerla con probabilidad
// `aprendizaje`. Es la única transición temporal del modelo y solo la usa el mini-test.
export function aplicarPractica(conjunta: Conjunta, habilidad: number, aprendizaje: number = APRENDIZAJE_DEFECTO): Conjunta {
  const k = kDe(conjunta);
  if (!Number.isInteger(habilidad) || habilidad < 0 || habilidad >= k) throw new MotorError("HABILIDAD_INVALIDA", `Habilidad inválida: ${String(habilidad)}`);
  if (!Number.isFinite(aprendizaje) || aprendizaje < 0 || aprendizaje > 1) throw new MotorError("APRENDIZAJE_INVALIDO", "El aprendizaje debe estar en [0, 1]");
  const bit = 1 << habilidad;
  const nueva = [...conjunta];
  conjunta.forEach((masa, estado) => {
    if ((estado & bit) === 0) {
      const movida = masa * aprendizaje;
      nueva[estado] = (nueva[estado] ?? 0) - movida;
      nueva[estado | bit] = (nueva[estado | bit] ?? 0) + movida;
    }
  });
  return normalizar(nueva);
}
