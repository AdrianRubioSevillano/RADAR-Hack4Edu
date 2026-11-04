// Carga bajo demanda de los informes reales. `?url` publica el archivo tal cual,
// sin copiarlo ni meterlo en el paquete de JavaScript.
import resultsUrl from "../../docs/engine/RESULTADOS_BENCHMARK.json?url";
import reportUrl from "../../docs/engine/RESULTADOS_BENCHMARK.md?url";
import timingsUrl from "../../docs/engine/RESULTADOS_BENCHMARK_TIEMPOS.json?url";
import type { BenchmarkResults } from "../benchmarks/index.ts";
import { buildBenchmarkView, type BenchmarkView } from "./benchmarkView.ts";

export const BENCHMARK_SOURCES = {
  results: "docs/engine/RESULTADOS_BENCHMARK.json",
  report: "docs/engine/RESULTADOS_BENCHMARK.md",
  timings: "docs/engine/RESULTADOS_BENCHMARK_TIEMPOS.json",
} as const;

export const BENCHMARK_REPORT_URL = reportUrl;

export interface BenchmarkExecution {
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly nodeVersion: string;
}

export interface LoadedBenchmark {
  readonly view: BenchmarkView;
  readonly execution: BenchmarkExecution | null;
}

function looksLikeResults(value: unknown): value is BenchmarkResults {
  if (typeof value !== "object" || value === null) return false;
  const { scenarios, config, kind } = value as Record<string, unknown>;
  return (
    Array.isArray(scenarios) &&
    typeof config === "object" &&
    config !== null &&
    typeof kind === "string"
  );
}

async function fetchJson(fetcher: typeof fetch, url: string): Promise<unknown> {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function loadBenchmark(
  fetcher: typeof fetch = fetch,
): Promise<LoadedBenchmark> {
  const data = await fetchJson(fetcher, resultsUrl);
  if (!looksLikeResults(data))
    throw new Error("El informe no tiene la forma esperada.");
  // Los tiempos solo aportan procedencia: sin ellos el informe sigue siendo válido.
  let execution: BenchmarkExecution | null = null;
  try {
    const timing = (await fetchJson(fetcher, timingsUrl)) as {
      readonly execution?: BenchmarkExecution;
    };
    execution = timing.execution ?? null;
  } catch {
    execution = null;
  }
  return { view: buildBenchmarkView(data), execution };
}
