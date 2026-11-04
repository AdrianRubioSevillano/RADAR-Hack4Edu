// Selección activa: ganancia de información esperada (EIG), exacta y en bits.
import { assertItem, mascara, probabilidadRespuesta } from "./dina.ts";
import { entropiaBinaria } from "./entropia.ts";
import { MotorError, type Conjunta, type Item } from "./tipos.ts";

const TOLERANCIA_EMPATE = 1e-12;
const TOLERANCIA_RESIDUO = 1e-12;

// EIG(q) = H_b(P(Y = 1)) − Σ_α π(α) · H_b(P(Y = 1 | α)).
export function eig(conjunta: Conjunta, item: Item): number {
  assertItem(item, Math.log2(conjunta.length));
  const mask = mascara(item.requiere);
  let acierto = 0;
  let condicional = 0;
  conjunta.forEach((masa, estado) => {
    const p = probabilidadRespuesta(estado, mask, item.slip, item.guess, true);
    acierto += masa * p;
    condicional += masa * entropiaBinaria(p);
  });
  const valor = entropiaBinaria(Math.min(Math.max(acierto, 0), 1)) - condicional;
  if (!Number.isFinite(valor) || valor < -TOLERANCIA_RESIDUO) throw new MotorError("EIG_INVALIDA", `EIG inválida: ${String(valor)}`);
  return Math.max(valor, 0);
}

// Máximo global de EIG y, entre las empatadas con ese máximo, el menor id.
export function mejorItem<T extends Item>(conjunta: Conjunta, candidatos: readonly T[]): T | null {
  const valorados = candidatos.map((item) => ({ item, valor: eig(conjunta, item) }));
  if (valorados.length === 0) return null;
  const maximo = Math.max(...valorados.map(({ valor }) => valor));
  const empatados = valorados
    .filter(({ valor }) => maximo - valor <= TOLERANCIA_EMPATE)
    .map(({ item }) => item)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return empatados[0] ?? null;
}
