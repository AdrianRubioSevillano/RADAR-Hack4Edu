// Tipos del motor. No dependen del contenido: una pregunta es aquí un "item" con
// las habilidades que exige y sus parámetros DINA.

export type Color = "verde" | "amarillo" | "rojo";

export interface Item {
  readonly id: string;
  readonly requiere: readonly number[]; // índices de habilidad, 0 … K−1
  readonly slip: number;
  readonly guess: number;
}

export type Conjunta = readonly number[];

export class MotorError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "MotorError";
    this.code = code;
  }
}
