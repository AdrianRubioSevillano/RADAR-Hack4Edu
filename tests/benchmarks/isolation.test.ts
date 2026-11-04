import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function sourcesOf(path: string): readonly string[] {
  const directory = new URL(path, import.meta.url);
  const files = readdirSync(directory).filter((file) => file.endsWith('.ts'));
  expect(files.length).toBeGreaterThan(0);
  return files.map((file) => readFileSync(new URL(file, directory), 'utf8'));
}

const BENCHMARKS = sourcesOf('../../src/benchmarks/');

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

  it('solo pasa la conjunta a la inferencia y no ejecuta funciones diagnósticas', () => {
    const forbidden = /createInitialDiagnosticState|updatePosterior|selectNextQuestion|submitAnswer|getClassDiagnostic|rankInterventions|compareInterventionPlans/;

    for (const source of BENCHMARKS) {
      expect(source).not.toMatch(forbidden);
      for (const call of source.match(/marginals\([^)]*\)/g) ?? []) {
        expect(call).toBe('marginals(state.joint)');
      }
    }
  });
});
