import { readFileSync, writeFileSync } from 'node:fs';
import { arch, platform } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderBenchmarkMarkdown, runBenchmark } from '../src/benchmarks/index.ts';
import type { BenchmarkReport, BenchmarkResults } from '../src/benchmarks/index.ts';

const REPORT_DIRECTORY = fileURLToPath(new URL('../docs/engine/', import.meta.url));

export const JSON_FILE = 'RESULTADOS_BENCHMARK.json';
export const MARKDOWN_FILE = 'RESULTADOS_BENCHMARK.md';
export const TIMING_FILE = 'RESULTADOS_BENCHMARK_TIEMPOS.json';

export function deterministicJson(results: BenchmarkResults): string {
  return `${JSON.stringify(results, null, 1)}\n`;
}

export interface ExecutionMetadata {
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly nodeVersion: string;
  readonly platform: string;
  readonly arch: string;
}

export function writeBenchmarkFiles(directory: string, report: BenchmarkReport, execution: ExecutionMetadata): void {
  writeFileSync(join(directory, JSON_FILE), deterministicJson(report.results));
  writeFileSync(join(directory, MARKDOWN_FILE), renderBenchmarkMarkdown(report.results));
  writeFileSync(
    join(directory, TIMING_FILE),
    `${JSON.stringify(
      {
        note: 'Tiempos y metadatos variables de una ejecución: no forman parte de los resultados deterministas.',
        execution,
        timing: report.timing,
      },
      null,
      2,
    )}\n`,
  );
}

// Regenera el bloque determinista y lo compara con lo escrito, sin tocar nada.
export function differingFiles(directory: string, results: BenchmarkResults): readonly string[] {
  const expected: readonly (readonly [string, string])[] = [
    [JSON_FILE, deterministicJson(results)],
    [MARKDOWN_FILE, renderBenchmarkMarkdown(results)],
  ];
  return expected.filter(([file, content]) => readFileSync(join(directory, file), 'utf8') !== content).map(([file]) => file);
}

function runAndWrite(): void {
  const startedAt = new Date().toISOString();
  const start = performance.now();
  const report = runBenchmark({ measureTiming: true });
  const durationMs = performance.now() - start;
  writeBenchmarkFiles(REPORT_DIRECTORY, report, {
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs,
    nodeVersion: process.version,
    platform: platform(),
    arch: arch(),
  });
  console.log(`Benchmark completo en ${(durationMs / 1000).toFixed(1)} s. Informes en ${REPORT_DIRECTORY}`);
}

function check(): void {
  const start = performance.now();
  const differing = differingFiles(REPORT_DIRECTORY, runBenchmark().results);
  const seconds = ((performance.now() - start) / 1000).toFixed(1);
  if (differing.length > 0) {
    console.error(`El bloque determinista no coincide: ${differing.join(', ')}`);
    process.exitCode = 1;
    return;
  }
  console.log(`El bloque determinista coincide con ${JSON_FILE} y ${MARKDOWN_FILE} (${seconds} s).`);
}

if (import.meta.main) {
  if (process.argv.includes('--check')) {
    check();
  } else {
    runAndWrite();
  }
}
