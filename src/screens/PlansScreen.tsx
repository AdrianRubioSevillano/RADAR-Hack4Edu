import { useState } from "react";
import { useRadar } from "../components/RadarProvider.tsx";
import { EmptyClassNotice, Notice, PageTitle } from "../components/ui.tsx";
import { decimal, minutes, percent } from "../services/format.ts";
import type { ActivePlan } from "../services/session.ts";
import {
  PLAN_LABELS,
  comparedPlan,
  comparisonNarrative,
  explainScore,
  parseMinutes,
  pendingRows,
  planSummary,
  skillName,
} from "../services/teacher.ts";

const PLAN_HELP: Readonly<Record<ActivePlan, string>> = {
  collective: "Maximiza el valor neto del conjunto con este presupuesto.",
  pendingNeed: "Minimiza la mayor necesidad estimada pendiente de un alumno.",
};

function Budget() {
  const { session, setMinutes } = useRadar();
  const [text, setText] = useState(String(session.availableMinutes));
  const [error, setError] = useState<string | null>(null);
  function apply(value: string) {
    setText(value);
    const parsed = parseMinutes(value);
    if (parsed === null) {
      setError("Escribe los minutos disponibles, por ejemplo 30.");
      return;
    }
    setError(null);
    setMinutes(parsed);
  }
  return (
    <section className="card" aria-labelledby="budget-title">
      <h2 id="budget-title">Presupuesto de tiempo</h2>
      <div className="controls">
        <label className="picker">
          <span>Minutos disponibles</span>
          <input
            value={text}
            inputMode="decimal"
            onChange={(e) => apply(e.target.value)}
            aria-invalid={error !== null}
          />
        </label>
        {[15, 30, 45, 60, 90].map((value) => (
          <button key={value} type="button" className="secondary" onClick={() => apply(String(value))}>
            {value} min
          </button>
        ))}
      </div>
      {error !== null && <p role="alert" className="error">{error}</p>}
    </section>
  );
}

export function PlansScreen() {
  const { session, plans, setActivePlan } = useRadar();
  const [open, setOpen] = useState<string | null>(null);
  const title = (
    <PageTitle
      eyebrow="RANKING Y PLANES"
      title="Dos formas de usar el mismo tiempo."
      intro="Compara el plan colectivo con el plan que minimiza la mayor necesidad estimada pendiente, y mira qué le queda pendiente a cada alumno."
    />
  );
  if (session.students.length === 0) return <>{title}<EmptyClassNotice /></>;
  if (!plans.ok)
    return (
      <>
        {title}
        <Budget />
        <Notice tone="error" title="No se puede calcular con ese presupuesto.">
          {plans.message} Los minutos admiten una resolución de un segundo.
        </Notice>
      </>
    );
  const { ranking, comparison } = plans;
  const hypothetical = ranking.basis === "hypotheticalPriorsOnly";
  const rows = pendingRows(comparison, session.students, session.activePlan);
  const planIds: readonly ActivePlan[] = ["collective", "pendingNeed"];
  return (
    <>
      {title}
      <Budget />
      {comparison.warnings.map((warning, i) => (
        <Notice key={`${warning.code}-${warning.skill ?? ""}-${i}`} tone="warning">{warning.message}</Notice>
      ))}
      <section className="card" aria-labelledby="ranking-title">
        <div className="section-heading">
          <h2 id="ranking-title">Ranking de competencias</h2>
          {hypothetical && <span className="pill">Cálculo hipotético: solo priors</span>}
        </div>
        {hypothetical && (
          <p>Sin respuestas no hay recomendación: este orden solo refleja los priors del modelo.</p>
        )}
        <div className="table-scroll" tabIndex={0} role="region" aria-labelledby="ranking-title">
          <table>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Competencia</th>
                <th scope="col">Duración</th>
                <th scope="col">Beneficio</th>
                <th scope="col">Coste</th>
                <th scope="col">Valor neto</th>
                <th scope="col">Valor / min</th>
                <th scope="col">Por qué</th>
              </tr>
            </thead>
            <tbody>
              {ranking.ranking.map((score, index) => (
                <tr key={score.id}>
                  <td>{index + 1}</td>
                  <th scope="row">{score.title}</th>
                  <td>{minutes(score.durationMinutes)}</td>
                  <td>{decimal(score.benefit)}</td>
                  <td>{decimal(score.cost)}</td>
                  <td>{decimal(score.netValue)}</td>
                  <td>{decimal(score.valuePerMinute, 4)}</td>
                  <td className="explain">{explainScore(score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card" aria-labelledby="compare-title">
        <div className="section-heading">
          <h2 id="compare-title">Comparación de planes</h2>
          {comparison.plansCoincide && !hypothetical && <span className="pill">Los dos planes coinciden</span>}
        </div>
        <p>{comparisonNarrative(comparison)}</p>
        <div className="plan-grid" role="radiogroup" aria-label="Plan activo para actividades y práctica">
          {planIds.map((id) => {
            const summary = planSummary(comparedPlan(comparison, id), session.students);
            const active = session.activePlan === id;
            return (
              <label key={id} className={`plan-card ${active ? "selected" : ""}`}>
                <span className="plan-head">
                  <input type="radio" name="active-plan" checked={active} onChange={() => setActivePlan(id)} />
                  <strong>{PLAN_LABELS[id]}</strong>
                </span>
                <small>{PLAN_HELP[id]}</small>
                <span className="plan-skills">
                  {summary.skills.length === 0
                    ? "Ninguna competencia programada"
                    : summary.skills.map((s) => s.name).join(" · ")}
                </span>
                <dl>
                  <div><dt>Tiempo</dt><dd>{minutes(summary.totalMinutes)}</dd></div>
                  <div><dt>Valor neto</dt><dd>{decimal(summary.netValue)}</dd></div>
                  <div><dt>Pendiente medio</dt><dd>{decimal(summary.meanPending)}</dd></div>
                  <div><dt>Pendiente máximo</dt><dd>{decimal(summary.maxPending)}</dd></div>
                </dl>
                {summary.highestPendingStudent !== null && <small>Mayor pendiente: {summary.highestPendingStudent}</small>}
              </label>
            );
          })}
        </div>
        <p className="table-note">
          Programar una competencia no significa que se haya aprendido ni que la
          intervención sea eficaz. Los índices son necesidad estimada según el
          modelo, no probabilidades de mejora. {comparison.disclaimer}
        </p>
        <div className="controls">
          <a className="primary" href="#/actividades">Ver actividades del plan activo</a>
          <a className="secondary" href="#/practica">Ver la práctica individual</a>
        </div>
      </section>
      <section className="card" aria-labelledby="pending-title">
        <h2 id="pending-title">Necesidad pendiente por alumno</h2>
        <p>
          Ordenado por el plan activo: {PLAN_LABELS[session.activePlan]}. Solo
          cuentan las competencias programadas directamente: no se da nada por
          resuelto en sus descendientes.
        </p>
        <div className="table-scroll" tabIndex={0} role="region" aria-labelledby="pending-title">
          <table>
            <thead>
              <tr>
                <th scope="col">Alumno</th>
                <th scope="col">Respuestas</th>
                <th scope="col">Inicial</th>
                <th scope="col">Pendiente (colectivo)</th>
                <th scope="col">Pendiente (necesidad)</th>
                <th scope="col"><span className="sr-only">Detalle</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.flatMap((row) => {
                const expanded = open === row.studentId;
                const main = (
                  <tr key={row.studentId}>
                    <th scope="row">
                      {row.displayName}
                      {row.basedOnPriorOnly && <small className="row-flag">Solo prior: sin evidencia</small>}
                    </th>
                    <td>{row.responseCount}</td>
                    <td>{decimal(row.baseline)}</td>
                    <td>{decimal(row.pendingCollective)}</td>
                    <td>{decimal(row.pendingNeed)}</td>
                    <td>
                      <button
                        type="button"
                        className="text-button"
                        aria-expanded={expanded}
                        onClick={() => setOpen(expanded ? null : row.studentId)}
                      >
                        {expanded ? "Ocultar" : "Detalle"}
                        <span className="sr-only"> de {row.displayName}</span>
                      </button>
                    </td>
                  </tr>
                );
                if (!expanded) return [main];
                return [
                  main,
                  <tr key={`${row.studentId}-detail`}>
                    <td colSpan={6}>
                      <table className="detail">
                        <thead>
                          <tr>
                            <th scope="col">Competencia</th>
                            <th scope="col">Necesidad estimada</th>
                            <th scope="col">Plan colectivo</th>
                            <th scope="col">Plan por necesidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {row.detail.map((skill) => (
                            <tr key={skill.skill}>
                              <th scope="row">{skillName(skill.skill)}</th>
                              <td>{percent(skill.need)}</td>
                              <td>{skill.collective === "scheduled" ? "Programada" : "Pendiente"}</td>
                              <td>{skill.pendingNeed === "scheduled" ? "Programada" : "Pendiente"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>,
                ];
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
