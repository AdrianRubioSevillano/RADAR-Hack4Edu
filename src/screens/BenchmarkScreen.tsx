import { useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Notice, PageTitle } from "../components/ui.tsx";
import { BENCHMARK_REPORT_URL, BENCHMARK_SOURCES, loadBenchmark, type LoadedBenchmark } from "../services/benchmarkLoader.ts";
import { METRICS, POSITION_LABELS, type ScenarioView } from "../services/benchmarkView.ts";
import { NOT_AVAILABLE, decimal, signedDecimal } from "../services/format.ts";

// Color y trazo fijos por método: la identidad no depende solo del color.
const METHOD_STYLE: Readonly<Record<string, { color: string; dash?: string; label: string } | undefined>> = {
  A: { color: "#c17d26", label: "A · orden fijo", dash: "9 4" },
  B: { color: "#158a6e", label: "B · adaptativo" },
  C: { color: "#5b6fb5", label: "C · aleatorio", dash: "2 4" },
};

function interval(lower: number | null, upper: number | null, digits = 4) {
  return lower === null || upper === null
    ? NOT_AVAILABLE
    : `[${decimal(lower, digits)}, ${decimal(upper, digits)}]`;
}

function ScenarioDetail({ scenario }: { scenario: ScenarioView }) {
  const [metric, setMetric] = useState<(typeof METRICS)[number]["id"]>("mae");
  const [budgetIndex, setBudgetIndex] = useState(0);
  const budget = scenario.budgets[budgetIndex];
  if (budget === undefined) return null;
  const metricLabel = METRICS.find((m) => m.id === metric)?.label ?? metric;
  const chart = scenario.budgets.map((item) => {
    const row: Record<string, string | number | null> = { budget: item.label };
    for (const method of item.methods)
      row[method.method] = method.metrics.find((m) => m.metric === metric)?.mean ?? null;
    return row;
  });
  return (
    <section className="card" aria-label={`Detalle: ${scenario.label}`}>
      <h2>{scenario.label}</h2>
      <p>{scenario.description}</p>
      {scenario.losses.length > 0 && (
        <Notice tone="warning" title="Intervalos que favorecen a A:">
          {scenario.losses.map((l) => `${l.metric} con ${l.budget}`).join("; ")}.
        </Notice>
      )}
      {scenario.divergences.length > 0 && (
        <Notice title="Mejor MAE no implica más aciertos de clasificación.">
          Con MAE favorable a B:{" "}
          {scenario.divergences.map((d) => `presupuesto ${d.budget}: ${d.metrics.join(", ")}`).join("; ")}.
        </Notice>
      )}
      <div className="controls">
        <label className="picker">
          <span>Métrica del gráfico</span>
          <select value={metric} onChange={(e) => setMetric(e.target.value as typeof metric)}>
            {METRICS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
      </div>
      <div className="chart chart-wide" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart} margin={{ top: 8, right: 24, left: 4, bottom: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="budget" axisLine={false} tickLine={false} />
            <YAxis width={52} axisLine={false} tickLine={false} tickFormatter={(v: number) => v.toFixed(2)} domain={["auto", "auto"]} />
            <Tooltip formatter={(v) => decimal(Number(v), 4)} labelFormatter={(l) => `Presupuesto ${String(l)}`} />
            <Legend />
            {(["A", "B", "C"] as const).map((id) => {
              const style = METHOD_STYLE[id];
              return (
                <Line
                  key={id}
                  dataKey={id}
                  name={style?.label ?? id}
                  stroke={style?.color}
                  strokeDasharray={style?.dash}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="table-note">Media de {metricLabel} por presupuesto de preguntas. Los valores e intervalos están en las tablas.</p>
      <div className="tabs" role="group" aria-label="Presupuesto de preguntas">
        {scenario.budgets.map((item, index) => (
          <button
            key={item.label}
            type="button"
            className={index === budgetIndex ? "tab active" : "tab"}
            aria-pressed={index === budgetIndex}
            onClick={() => setBudgetIndex(index)}
          >
            {item.label === "todas" ? "Todas" : `${item.label} preguntas`}
          </button>
        ))}
      </div>
      <h3>Diferencia emparejada B − A, presupuesto {budget.label}</h3>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Diferencia emparejada B menos A">
        <table>
          <thead>
            <tr>
              <th scope="col">Métrica</th>
              <th scope="col">Mejor si</th>
              <th scope="col">Media B − A</th>
              <th scope="col">IC 95 %</th>
              <th scope="col">Posición del intervalo</th>
              <th scope="col">B mejora</th>
              <th scope="col">Empate</th>
              <th scope="col">B empeora</th>
              <th scope="col">Parejas</th>
            </tr>
          </thead>
          <tbody>
            {budget.comparisons.map((row) => (
              <tr key={row.metric}>
                <th scope="row">{row.label}</th>
                <td>{row.direction === "lowerIsBetter" ? "Menor" : "Mayor"}</td>
                <td>{signedDecimal(row.mean)}</td>
                <td>{interval(row.lower, row.upper)}</td>
                <td>{POSITION_LABELS[row.position]}</td>
                <td>{row.improved}</td>
                <td>{row.tied}</td>
                <td>{row.worsened}</td>
                <td>{row.pairs}{row.excluded > 0 ? ` (${row.excluded} excl.)` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Medias por método, presupuesto {budget.label}</h3>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Medias por método">
        <table>
          <thead>
            <tr>
              <th scope="col">Métrica</th>
              {budget.methods.map((m) => <th key={m.method} scope="col">{METHOD_STYLE[m.method]?.label ?? m.method}</th>)}
            </tr>
          </thead>
          <tbody>
            {METRICS.map(({ id, label }) => (
              <tr key={id}>
                <th scope="row">{label}</th>
                {budget.methods.map((method) => {
                  const value = method.metrics.find((m) => m.metric === id);
                  return (
                    <td key={method.method}>
                      {decimal(value?.mean ?? null, 4)}
                      <small className="row-flag">{interval(value?.lower ?? null, value?.upper ?? null)}</small>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function BenchmarkScreen() {
  const [data, setData] = useState<LoadedBenchmark | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(null);
    loadBenchmark()
      .then((loaded) => { if (active) setData(loaded); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Error desconocido");
      });
    return () => { active = false; };
  }, [attempt]);

  const title = (
    <PageTitle
      eyebrow="EVIDENCIA EN SIMULACIÓN"
      title="Qué mide el benchmark y qué no."
      intro="Informes ya generados del experimento de diagnóstico. Esta pantalla los lee: no ejecuta el experimento ni edita sus cifras."
    />
  );
  if (error !== null)
    return (
      <>
        {title}
        <Notice tone="error" title="No se ha podido cargar el informe.">{error}</Notice>
        <button type="button" className="primary" onClick={() => setAttempt(attempt + 1)}>Reintentar</button>
      </>
    );
  if (data === null) return <>{title}<p role="status">Cargando el informe…</p></>;

  const { view, execution } = data;
  const { provenance } = view;
  const scenario = view.scenarios[scenarioIndex];
  return (
    <>
      {title}
      {!provenance.isFullExperiment && (
        <Notice tone="warning" title="Informe de prueba.">
          Este archivo tiene kind “{provenance.kind}”: no debe presentarse como el experimento.
        </Notice>
      )}
      <Notice title="Datos sintéticos.">{provenance.disclaimer}</Notice>
      <section className="card" aria-labelledby="reading-title">
        <h2 id="reading-title">Cómo leerlo</h2>
        <ul>
          <li>Evalúa el diagnóstico. No valida planes, actividades ni intervenciones.</li>
          <li>Mejor MAE no implica más aciertos de clasificación: miden cosas distintas.</li>
          <li>Un intervalo que incluye cero no demuestra equivalencia.</li>
          <li>Un intervalo que excluye cero no garantiza superioridad: la posición es descriptiva y no corrige por multiplicidad.</li>
          <li>Con todas las preguntas, B − A es cero por construcción: comprueba el código, no favorece a ningún método.</li>
          <li>Los resultados sintéticos no prueban eficacia educativa.</li>
        </ul>
      </section>
      <section className="card" aria-labelledby="summary-title">
        <h2 id="summary-title">Resumen de B − A en los tres escenarios</h2>
        <div className="table-scroll" tabIndex={0} role="region" aria-labelledby="summary-title">
          <table>
            <thead>
              <tr>
                <th scope="col">Escenario</th>
                <th scope="col">Presupuesto</th>
                <th scope="col">IC favorece a B</th>
                <th scope="col">IC favorece a A</th>
                <th scope="col">IC incluye 0</th>
                <th scope="col">Sin intervalo</th>
                <th scope="col">B mejora</th>
                <th scope="col">Empate</th>
                <th scope="col">B empeora</th>
              </tr>
            </thead>
            <tbody>
              {view.scenarios.flatMap((item) =>
                item.budgets.map((budget) => (
                  <tr key={`${item.id}-${budget.label}`}>
                    <th scope="row">{item.label}</th>
                    <td>{budget.label}</td>
                    <td>{budget.tally.favorsB}</td>
                    <td>{budget.tally.favorsA}</td>
                    <td>{budget.tally.includesZero}</td>
                    <td>{budget.tally.unavailable}</td>
                    <td>{budget.tally.improved}</td>
                    <td>{budget.tally.tied}</td>
                    <td>{budget.tally.worsened}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
        <p className="table-note">Siete métricas por fila. B mejora, Empate y B empeora cuentan comparaciones por semilla (semillas × métricas).</p>
      </section>
      <div className="tabs" role="group" aria-label="Escenario">
        {view.scenarios.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === scenarioIndex ? "tab active" : "tab"}
            aria-pressed={index === scenarioIndex}
            onClick={() => setScenarioIndex(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {scenario !== undefined && <ScenarioDetail key={scenario.id} scenario={scenario} />}
      <section className="card" aria-labelledby="provenance-title">
        <h2 id="provenance-title">Procedencia</h2>
        <dl className="provenance">
          <div><dt>Archivo de datos</dt><dd>{BENCHMARK_SOURCES.results}</dd></div>
          <div><dt>Tipo de ejecución</dt><dd>{provenance.kind}</dd></div>
          <div><dt>Versión del benchmark</dt><dd>{provenance.benchmarkVersion}</dd></div>
          <div><dt>Generador</dt><dd>{provenance.generator.algorithm} v{provenance.generator.version}</dd></div>
          <div><dt>Semilla base</dt><dd>{provenance.baseSeed}</dd></div>
          <div><dt>Semilla de bootstrap</dt><dd>{provenance.bootstrapSeed}</dd></div>
          <div><dt>Réplicas</dt><dd>{provenance.replicas}</dd></div>
          <div><dt>Alumnos por réplica</dt><dd>{provenance.studentsPerReplica}</dd></div>
          <div><dt>Remuestreos</dt><dd>{provenance.resamples}</dd></div>
          <div><dt>Métodos</dt><dd>{provenance.methods.join(", ")}</dd></div>
          {execution !== null && <div><dt>Generado</dt><dd>{execution.finishedAt} con Node {execution.nodeVersion}</dd></div>}
        </dl>
        <a className="text-button" href={BENCHMARK_REPORT_URL} target="_blank" rel="noreferrer">
          Abrir el informe completo ({BENCHMARK_SOURCES.report})
        </a>
      </section>
    </>
  );
}
