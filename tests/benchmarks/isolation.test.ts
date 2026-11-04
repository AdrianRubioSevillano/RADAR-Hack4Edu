import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function sourcesOf(path: string, keep: (file: string) => boolean = () => true): readonly string[] {
  const directory = new URL(path, import.meta.url);
  const files = readdirSync(directory).filter((file) => file.endsWith('.ts') && keep(file));
  expect(files.length).toBeGreaterThan(0);
  return files.map((file) => readFileSync(new URL(file, directory), 'utf8'));
}

// Único módulo que coordina diagnóstico y respuestas sintéticas.
const COORDINATOR = 'methods.ts';

const BENCHMARKS = sourcesOf('../../src/benchmarks/');
const WITHOUT_COORDINATOR = sourcesOf('../../src/benchmarks/', (file) => file !== COORDINATOR);
const [COORDINATOR_SOURCE = ''] = sourcesOf('../../src/benchmarks/', (file) => file === COORDINATOR);

describe('src/benchmarks', () => {
  it('no usa Math.random', () => {
    for (const source of BENCHMARKS) {
      expect(source).not.toContain('Math.random');
    }
  });

  it('src/engine y src/simulation no lo importan', () => {
    for (const source of [...sourcesOf('../../src/engine/'), ...sourcesOf('../../src/simulation/')]) {
      expect(source).not.toMatch(/from '[^']*benchmarks/);
    }
  });

  it('fuera del coordinador no ejecuta funciones diagnósticas y solo pasa la conjunta a la inferencia', () => {
    const forbidden = /createInitialDiagnosticState|updatePosterior|selectNextQuestion|submitAnswer|getClassDiagnostic|rankInterventions|compareInterventionPlans/;

    for (const source of WITHOUT_COORDINATOR) {
      expect(source).not.toMatch(forbidden);
      for (const call of source.match(/marginals\([^)]*\)/g) ?? []) {
        expect(call).toBe('marginals(state.joint)');
      }
    }
  });

  it('la API pública no importa módulos de Node: debe poder usarse en el navegador', () => {
    for (const source of BENCHMARKS) {
      expect(source).not.toMatch(/from 'node:|\bprocess\.|require\(/);
    }
  });

  it('fuera del coordinador no usa reloj', () => {
    for (const source of WITHOUT_COORDINATOR) {
      expect(source).not.toMatch(/\bDate\b|performance\./);
    }
  });

  it('el coordinador solo inicializa, selecciona y registra respuestas', () => {
    expect(COORDINATOR_SOURCE).toMatch(/selectNextQuestion/);
    expect(COORDINATOR_SOURCE).not.toMatch(/updatePosterior|getClassDiagnostic|rankInterventions|compareInterventionPlans|\bDate\b/);
  });

  it('el coordinador no lee la verdad simulada ni los uniformes', () => {
    expect(COORDINATOR_SOURCE).not.toMatch(/trueMastery|groupId|\.correctness|\.distractor|\.entries/);
  });

  it('las llamadas diagnósticas del coordinador no citan clase, uniformes ni parámetros reales', () => {
    const calls = COORDINATOR_SOURCE.match(/(createInitialDiagnosticState|selectNextQuestion|submitAnswer)\([^)]*\)/g) ?? [];

    expect(calls.length).toBeGreaterThanOrEqual(4);
    for (const call of calls) {
      expect(call).not.toMatch(/syntheticClass|uniforms|real/i);
    }
  });
});
