import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function sourcesOf(path: string, keep: (file: string) => boolean = () => true): readonly string[] {
  const directory = new URL(path, import.meta.url);
  const files = readdirSync(directory).filter((file) => file.endsWith('.ts') && keep(file));
  expect(files.length).toBeGreaterThan(0);
  return files.map((file) => readFileSync(new URL(file, directory), 'utf8'));
}

// Único módulo que coordina el postest: recibe la verdad y también llama al diagnóstico.
const COORDINATOR = 'postIntervention.ts';

const ENGINE = sourcesOf('../../src/engine/');
const SIMULATION = sourcesOf('../../src/simulation/');
const SIMULATION_WITHOUT_COORDINATOR = sourcesOf('../../src/simulation/', (file) => file !== COORDINATOR);
const [COORDINATOR_SOURCE = ''] = sourcesOf('../../src/simulation/', (file) => file === COORDINATOR);

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

    for (const source of SIMULATION_WITHOUT_COORDINATOR) {
      expect(source).not.toMatch(forbidden);
    }
  });

  it('el coordinador del postest solo inicializa y registra respuestas', () => {
    expect(COORDINATOR_SOURCE).toMatch(/createInitialDiagnosticState/);
    expect(COORDINATOR_SOURCE).toMatch(/submitAnswer/);
    expect(COORDINATOR_SOURCE).not.toMatch(/updatePosterior|selectNextQuestion|getClassDiagnostic|rankInterventions|compareInterventionPlans/);
  });

  it('las llamadas diagnósticas del coordinador no citan verdad ni uniformes', () => {
    const calls = COORDINATOR_SOURCE.match(/(createInitialDiagnosticState|submitAnswer)\([^)]*\)/g) ?? [];

    expect(calls.length).toBeGreaterThanOrEqual(3);
    for (const call of calls) {
      expect(call).not.toMatch(/trueMastery|classState|postClass|uniforms|mastery|student\b/i);
    }
  });
});
