import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { BenchmarkResults } from "../../src/benchmarks/index.ts";
import { loadBenchmark } from "../../src/services/benchmarkLoader.ts";
import {
  METRICS,
  SCENARIO_LABELS,
  buildBenchmarkView,
} from "../../src/services/benchmarkView.ts";

const raw = readFileSync("docs/engine/RESULTADOS_BENCHMARK.json", "utf8");
const results = JSON.parse(raw) as BenchmarkResults;
const report = readFileSync("docs/engine/RESULTADOS_BENCHMARK.md", "utf8");
const view = buildBenchmarkView(results);

describe("vista del benchmark", () => {
  it("procede del experimento completo y muestra su procedencia", () => {
    expect(view.provenance.isFullExperiment).toBe(true);
    expect(view.provenance.baseSeed).toBe(results.config.baseSeed);
    expect(view.provenance.replicas).toBe(results.replicaSeeds.length);
    expect(view.provenance.disclaimer).toBe(results.disclaimer);
  });

  it("muestra los tres escenarios y todos los presupuestos", () => {
    expect(view.scenarios.map((s) => s.id)).toEqual(results.scenarios.map((s) => s.definition.id));
    expect(view.scenarios).toHaveLength(3);
    for (const scenario of view.scenarios) {
      expect(scenario.budgets.map((b) => b.budget)).toEqual(results.config.budgets);
      for (const budget of scenario.budgets) {
        expect(budget.comparisons).toHaveLength(METRICS.length);
        expect(budget.methods.map((m) => m.method)).toEqual(["A", "B", "C"]);
      }
    }
  });

  it("no altera ninguna cifra", () => {
    for (const [i, scenario] of view.scenarios.entries()) {
      const source = results.scenarios[i]!;
      for (const budget of scenario.budgets) {
        for (const row of budget.comparisons) {
          const found = source.comparisons.find(
            (c) => c.requestedBudget === budget.budget && c.metric === row.metric,
          )!.comparison;
          expect(row.mean).toBe(found.differences.mean);
          expect(row.lower).toBe(found.differences.confidenceInterval?.lower ?? null);
          expect(row.upper).toBe(found.differences.confidenceInterval?.upper ?? null);
          expect(row.improved).toBe(found.improvedCount);
          expect(row.tied).toBe(found.tiedCount);
          expect(row.worsened).toBe(found.worsenedCount);
        }
      }
    }
  });

  it("coincide con la tabla resumen del informe generado", () => {
    let checked = 0;
    for (const scenario of view.scenarios) {
      for (const budget of scenario.budgets) {
        const { tally } = budget;
        const line = `| ${SCENARIO_LABELS[scenario.id]} | ${budget.label} | ${tally.favorsB} | ${tally.favorsA} | ${tally.includesZero} | ${tally.unavailable} | ${tally.improved} | ${tally.tied} | ${tally.worsened} |`;
        expect(report).toContain(line);
        checked += 1;
      }
    }
    expect(checked).toBe(15);
  });

  it("no esconde las pérdidas ni la divergencia entre MAE y clasificación", () => {
    const misspecified = view.scenarios.find((s) => s.id === "misspecified")!;
    expect(misspecified.losses.length).toBeGreaterThan(0);
    expect(misspecified.losses.some((l) => l.metric === "Log-loss")).toBe(true);
    expect(misspecified.divergences.length).toBeGreaterThan(0);
  });

  it("con todas las preguntas B − A es cero y se muestra como empate", () => {
    for (const scenario of view.scenarios) {
      const all = scenario.budgets.find((b) => b.budget === "all")!;
      expect(all.tally.improved + all.tally.worsened).toBe(0);
      expect(all.tally.includesZero).toBe(7);
    }
  });

  it("marca un informe de prueba como no experimental", () => {
    const test = buildBenchmarkView({ ...results, kind: "test" });
    expect(test.provenance.isFullExperiment).toBe(false);
  });
});

describe("carga bajo demanda", () => {
  const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

  it("carga el informe y los tiempos sin ejecutar el experimento", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) =>
      String(url).includes("TIEMPOS")
        ? ok({ execution: { finishedAt: "t", durationMs: 1, nodeVersion: "v" } })
        : ok(results),
    );
    const loaded = await loadBenchmark(fetcher as typeof fetch);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(loaded.view.scenarios).toHaveLength(3);
    expect(loaded.execution?.nodeVersion).toBe("v");
  });

  it("falla con un error claro si el informe no existe o está mal", async () => {
    await expect(
      loadBenchmark((async () => new Response("", { status: 404 })) as typeof fetch),
    ).rejects.toThrow("HTTP 404");
    await expect(loadBenchmark((async () => ok({ nada: 1 })) as typeof fetch)).rejects.toThrow(
      "forma esperada",
    );
  });

  it("sigue funcionando sin el archivo de tiempos", async () => {
    const fetcher = async (url: RequestInfo | URL) =>
      String(url).includes("TIEMPOS") ? new Response("", { status: 404 }) : ok(results);
    const loaded = await loadBenchmark(fetcher as typeof fetch);
    expect(loaded.execution).toBeNull();
  });
});
