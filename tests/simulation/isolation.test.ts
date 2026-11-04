import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function sourcesOf(path: string): readonly string[] {
  const directory = new URL(path, import.meta.url);
  const files = readdirSync(directory).filter((file) => file.endsWith('.ts'));
  expect(files.length).toBeGreaterThan(0);
  return files.map((file) => readFileSync(new URL(file, directory), 'utf8'));
}

const ENGINE = sourcesOf('../../src/engine/');
const SIMULATION = sourcesOf('../../src/simulation/');

describe('aleatoriedad y determinismo', () => {
  it('src/engine y src/simulation no usan Math.random', () => {
    for (const source of [...ENGINE, ...SIMULATION]) {
      expect(source).not.toContain('Math.random');
    }
  });

  it('src/simulation no usa reloj ni identificadores aleatorios', () => {
    for (const source of SIMULATION) {
      expect(source).not.toMatch(/Date\b|performance\.|crypto|randomUUID|process\./);
    }
  });
});

describe('separación entre motor y verdad simulada', () => {
  it('src/engine no importa src/simulation', () => {
    for (const source of ENGINE) {
      expect(source).not.toMatch(/from '[^']*simulation/);
    }
  });

  it('src/engine no define tipos de verdad simulada', () => {
    for (const source of ENGINE) {
      expect(source).not.toMatch(/trueMastery|SyntheticClass|SyntheticStudent/);
    }
  });

  it('src/simulation no crea diagnósticos ni recomendaciones', () => {
    const forbidden = /createInitialDiagnosticState|updatePosterior|selectNextQuestion|submitAnswer|getClassDiagnostic|rankInterventions|compareInterventionPlans/;

    for (const source of SIMULATION) {
      expect(source).not.toMatch(forbidden);
    }
  });
});
