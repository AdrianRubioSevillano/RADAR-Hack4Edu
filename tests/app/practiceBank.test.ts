import { describe, expect, it } from "vitest";
import { isCanonicalRational, normalizeRational, RADAR_QUESTION_BANK, KNOWLEDGE_GRAPH } from "../../src/services/engine.ts";
import { ACTIVITY_TEMPLATES } from "../../src/services/collective.ts";
import { PRACTICE_TEMPLATES, SKILL_HINTS } from "../../src/services/practiceBank.ts";
import { add, div, mul, q, show, sub, type Exact } from "../engine/support/exact.ts";

// Evaluador propio del test: expresiones con enteros, fracciones, paréntesis, · : + -
// y una variable x. No comparte código con src/.
function evaluate(expression: string, x: Exact): Exact {
  const text = expression.replaceAll(" ", "");
  let position = 0;
  const peek = () => text[position];
  function primary(): Exact {
    if (peek() === "(") {
      position += 1;
      const value = sum();
      if (peek() !== ")") throw new Error(`Falta ) en ${expression}`);
      position += 1;
      return value;
    }
    if (peek() === "x") {
      position += 1;
      return x;
    }
    const start = position;
    while (/\d/.test(peek() ?? "")) position += 1;
    if (start === position) throw new Error(`Número esperado en ${expression}@${position}`);
    return q(BigInt(text.slice(start, position)));
  }
  // Producto implícito (3x, 2(x + 1)) y fracción a/b, con prioridad sobre · y :.
  function factor(): Exact {
    if (peek() === "-") {
      position += 1;
      return mul(q(-1), factor());
    }
    let value = primary();
    for (;;) {
      if (peek() === "/") {
        position += 1;
        value = div(value, primary());
      } else if (peek() === "x" || peek() === "(") {
        value = mul(value, primary());
      } else return value;
    }
  }
  function product(): Exact {
    let value = factor();
    while (peek() === "·" || peek() === ":") {
      const op = peek();
      position += 1;
      value = op === "·" ? mul(value, factor()) : div(value, factor());
    }
    return value;
  }
  function sum(): Exact {
    let value = product();
    while (peek() === "+" || peek() === "-") {
      const op = peek();
      position += 1;
      value = op === "+" ? add(value, product()) : sub(value, product());
    }
    return value;
  }
  const result = sum();
  if (position !== text.length) throw new Error(`Sobra texto en ${expression}`);
  return result;
}

const canonical = (text: string) => {
  const result = normalizeRational(text);
  if (!result.ok) throw new Error(text);
  return result.value;
};

describe("plantillas de práctica", () => {
  it("el evaluador del test funciona con casos conocidos", () => {
    expect(show(evaluate("2 + 3·(-5)", q(0)))).toBe("-13/1");
    expect(show(evaluate("3/7 : 9/14", q(0)))).toBe("2/3");
    expect(show(evaluate("2(x + 1)", q(3)))).toBe("8/1");
    expect(show(evaluate("x/3 + x/6", q(6)))).toBe("3/1");
  });

  it.each(PRACTICE_TEMPLATES.map((t) => [t.id, t] as const))(
    "%s: la respuesta se verifica de forma independiente",
    (_id, template) => {
      const expected = canonical(template.answer);
      const { check } = template;
      if (check.kind === "evaluate") {
        expect(show(evaluate(check.expression, q(0)))).toBe(expected);
      } else if (check.kind === "coefficient") {
        // Lineal: el coeficiente es f(1) - f(0), y debe ser lineal de verdad.
        const f0 = evaluate(check.expression, q(0));
        const f1 = evaluate(check.expression, q(1));
        const f2 = evaluate(check.expression, q(2));
        expect(show(sub(f1, f0))).toBe(expected);
        expect(show(sub(f2, f1))).toBe(expected);
      } else {
        const [n, d = "1"] = expected.split("/");
        const solution = q(BigInt(n!), BigInt(d));
        const left = evaluate(check.left, solution);
        const right = evaluate(check.right, solution);
        expect(show(left)).toBe(show(right));
        // Solución única: la x no se cancela.
        const slope = sub(
          sub(evaluate(check.left, q(1)), evaluate(check.right, q(1))),
          sub(evaluate(check.left, q(0)), evaluate(check.right, q(0))),
        );
        expect(slope.n).not.toBe(0n);
      }
    },
  );

  it("cubre las seis competencias con ids únicos, sin chocar con el banco", () => {
    const ids = PRACTICE_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const bankIds = new Set(RADAR_QUESTION_BANK.questions.map((question) => question.id));
    expect(ids.some((id) => bankIds.has(id))).toBe(false);
    for (const skill of KNOWLEDGE_GRAPH.nodes) {
      expect(PRACTICE_TEMPLATES.filter((t) => t.skill === skill.id).length).toBeGreaterThanOrEqual(5);
      expect(SKILL_HINTS[skill.id]?.length).toBeGreaterThanOrEqual(2);
      expect(ACTIVITY_TEMPLATES[skill.id]?.steps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("no repite enunciados del banco diagnóstico", () => {
    const statements = new Set(RADAR_QUESTION_BANK.questions.map((question) => question.statement));
    for (const template of PRACTICE_TEMPLATES)
      expect(statements.has(template.statement)).toBe(false);
  });

  it("las pistas no contienen la respuesta", () => {
    for (const template of PRACTICE_TEMPLATES) {
      const hints = SKILL_HINTS[template.skill] ?? [];
      for (const hint of hints)
        expect(hint.includes(`= ${template.answer}`)).toBe(false);
    }
  });

  it("las respuestas se pueden normalizar", () => {
    for (const template of PRACTICE_TEMPLATES)
      expect(isCanonicalRational(canonical(template.answer))).toBe(true);
  });
});
