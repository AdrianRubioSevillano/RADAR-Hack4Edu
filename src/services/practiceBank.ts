// Ejercicios de práctica: plantillas deterministas, separadas del banco diagnóstico.
// SIN REVISIÓN DOCENTE. Cada respuesta se recalcula de forma independiente en
// tests/app/practiceBank.test.ts a partir de `check`.
import type { Difficulty, SkillId } from "./engine.ts";

export type PracticeCheck =
  | { readonly kind: "evaluate"; readonly expression: string }
  | { readonly kind: "coefficient"; readonly expression: string }
  | {
      readonly kind: "solve";
      readonly left: string;
      readonly right: string;
    };

export interface TemplateExercise {
  readonly id: string;
  readonly skill: SkillId;
  readonly difficulty: Difficulty;
  readonly statement: string;
  readonly answer: string;
  readonly method: string;
  readonly check: PracticeCheck;
}

type Row = readonly [Difficulty, string, string, string];

function evaluateRows(skill: SkillId, rows: readonly Row[]) {
  return rows.map(
    ([difficulty, expression, answer, method], index): TemplateExercise => ({
      id: `P-${skill}-${index + 1}`,
      skill,
      difficulty,
      statement: `Calcula: ${expression}.`,
      answer,
      method,
      check: { kind: "evaluate", expression },
    }),
  );
}

function coefficientRows(skill: SkillId, rows: readonly Row[]) {
  return rows.map(
    ([difficulty, expression, answer, method], index): TemplateExercise => ({
      id: `P-${skill}-${index + 1}`,
      skill,
      difficulty,
      statement: `Simplifica ${expression} y escribe el coeficiente de x del resultado.`,
      answer,
      method,
      check: { kind: "coefficient", expression },
    }),
  );
}

function solveRows(skill: SkillId, rows: readonly Row[]) {
  return rows.map(
    ([difficulty, equation, answer, method], index): TemplateExercise => {
      const [left = "", right = ""] = equation.split(" = ");
      return {
        id: `P-${skill}-${index + 1}`,
        skill,
        difficulty,
        statement: `Resuelve: ${equation}. Escribe el valor de x.`,
        answer,
        method,
        check: { kind: "solve", left, right },
      };
    },
  );
}

export const PRACTICE_TEMPLATES: readonly TemplateExercise[] = [
  ...evaluateRows("OPS", [
    [1, "58 + 27", "85", "Suma unidades y decenas, con la llevada."],
    [1, "92 - 47", "45", "Resta por columnas y pide prestado a las decenas."],
    [1, "7·6", "42", "Usa la tabla del 7."],
    [2, "23·4", "92", "Multiplica 20·4 y 3·4, y suma los resultados."],
    [2, "96 : 8", "12", "Busca qué número multiplicado por 8 da 96."],
    [3, "403 - 156", "247", "Pide prestado pasando por las decenas, que valen 0."],
  ]),
  ...evaluateRows("NEG", [
    [1, "-7 + 3", "-4", "Signos distintos: resta y conserva el signo del mayor valor absoluto."],
    [1, "5 - 9", "-4", "Quitas más de lo que tienes: el resultado es negativo."],
    [1, "(-6)·4", "-24", "Signos distintos al multiplicar: resultado negativo."],
    [2, "3 - (-8)", "11", "Restar un negativo equivale a sumar su opuesto."],
    [2, "(-20) : (-5)", "4", "Signos iguales al dividir: resultado positivo."],
    [3, "(-2)·5·(-3)", "30", "Dos factores negativos: el resultado es positivo."],
  ]),
  ...evaluateRows("FRA", [
    [1, "3/5 + 1/5", "4/5", "Mismo denominador: suma los numeradores."],
    [1, "1/2 + 1/4", "3/4", "Escribe 1/2 como 2/4 y suma."],
    [2, "5/6 - 1/3", "1/2", "Escribe 1/3 como 2/6, resta y simplifica."],
    [2, "2/5 · 3/4", "3/10", "Multiplica numeradores y denominadores, y simplifica."],
    [2, "12/18", "2/3", "Divide numerador y denominador entre 6."],
    [3, "3/7 : 9/14", "2/3", "Multiplica por la fracción inversa y simplifica."],
  ]),
  ...evaluateRows("JER", [
    [1, "5 + 4·3", "17", "Primero la multiplicación, después la suma."],
    [1, "30 - 18 : 3", "24", "Primero la división, después la resta."],
    [2, "3·(2 + 6) - 5", "19", "Primero el paréntesis, después el producto y la resta."],
    [2, "18 : (2 + 1) + 4", "10", "Paréntesis, división y suma, en ese orden."],
    [2, "(8 - 2)·(1 + 4)", "30", "Resuelve cada paréntesis y multiplica."],
    [3, "2 + 3·(-5)", "-13", "Primero el producto, con su signo, y después la suma."],
  ]),
  ...coefficientRows("ALG", [
    [1, "5x + 2x - 3x", "4", "Suma y resta los coeficientes de x."],
    [1, "4x + 7 - x + 2", "3", "Agrupa los términos en x: 4x - x."],
    [2, "3(x + 2) + x", "4", "Reparte el 3 y agrupa los términos en x."],
    [2, "6x - (2x - 1)", "4", "El signo menos cambia cada término del paréntesis."],
    [2, "2(x - 3) + 3x", "5", "Reparte el 2 y agrupa los términos en x."],
    [3, "x/3 + x/6", "1/2", "Pon denominador común: 2x/6 + x/6."],
  ]),
  ...solveRows("ECU", [
    [1, "2x + 5 = 13", "4", "Resta 5 en los dos miembros y divide entre 2."],
    [1, "4x - 3 = 9", "3", "Suma 3 en los dos miembros y divide entre 4."],
    [2, "2(x + 1) = 10", "4", "Reparte el 2 o divide primero los dos miembros entre 2."],
    [2, "3x + 2 = x + 10", "4", "Agrupa las x en un miembro y los números en el otro."],
    [2, "5x - 7 = 2x + 8", "5", "Agrupa las x en un miembro y los números en el otro."],
    [3, "x/3 + 1 = 4", "9", "Resta 1 y multiplica los dos miembros por 3."],
  ]),
];

// Pistas progresivas por competencia: orientan el método, no dan el resultado.
export const SKILL_HINTS: Readonly<Record<SkillId, readonly string[]>> = {
  OPS: [
    "Escribe la operación por columnas o descomponla en partes más fáciles.",
    "Comprueba el resultado con la operación inversa.",
  ],
  NEG: [
    "Fíjate en el signo de cada número antes de operar.",
    "Al multiplicar o dividir: signos iguales dan positivo y signos distintos, negativo.",
  ],
  FRA: [
    "Para sumar o restar necesitas un denominador común.",
    "Al terminar, comprueba si la fracción se puede simplificar.",
  ],
  JER: [
    "Orden: paréntesis, después productos y divisiones, y al final sumas y restas.",
    "Rodea primero la operación que toca hacer y resuélvela sola.",
  ],
  ALG: [
    "Solo se agrupan términos semejantes: las x con las x y los números con los números.",
    "Si hay un paréntesis, quítalo antes de agrupar.",
  ],
  ECU: [
    "Haz la misma operación en los dos miembros de la igualdad.",
    "Al terminar, sustituye tu valor de x para comprobar que la igualdad se cumple.",
  ],
};
