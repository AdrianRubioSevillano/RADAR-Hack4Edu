import { useState, type CSSProperties } from "react";
import { Icon, SkillBadge } from "../components/art.tsx";
import { useRadar } from "../components/RadarProvider.tsx";
import { PLAN_THEME, skillTheme } from "../components/theme.ts";
import { EmptyClassNotice, Notice, PageTitle } from "../components/ui.tsx";
import { observedBySkill } from "../services/diagnostic.ts";
import type { ComparedPlan, InterventionPlanComparison, InterventionRanking, InterventionScore } from "../services/engine.ts";
import { decimal, minutes, percent } from "../services/format.ts";
import { stateOf, type ActivePlan } from "../services/session.ts";
import {
  PLAN_LABELS,
  comparedPlan,
  comparisonNarrative,
  explainScore,
  parseMinutes,
  pendingRows,
  planSummary,
  readableMessage,
  skillName,
} from "../services/teacher.ts";

const PLAN_HELP: Readonly<Record<ActivePlan, string>> = {
  collective: "Maximiza el valor neto del conjunto con este presupuesto.",
  pendingNeed: "Minimiza la mayor necesidad estimada pendiente de un alumno.",
};

const PLAN_IDS: readonly ActivePlan[] = ["collective", "pendingNeed"];

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
    <section className="panel panel-navy budget" aria-labelledby="budget-title">
      <div>
        <h2 id="budget-title">¿Cuánto tiempo tienes?</h2>
        <p>Cada competencia ocupa 15 minutos (SUPUESTO). El plan cambia al momento.</p>
      </div>
      <div className="budget-dial">
        <label className="budget-number">
          <span className="sr-only">Minutos disponibles</span>
          <input value={text} inputMode="decimal" onChange={(e) => apply(e.target.value)} aria-invalid={error !== null} aria-describedby={error === null ? undefined : "budget-error"} />
          <span aria-hidden="true">min</span>
        </label>
        <div className="budget-controls">
          <input
            type="range"
            min={0}
            max={120}
            step={5}
            value={Math.min(session.availableMinutes, 120)}
            aria-label="Minutos disponibles, de 0 a 120"
            aria-valuetext={`${session.availableMinutes} minutos`}
            onChange={(e) => apply(e.target.value)}
          />
          <div className="presets">
            {[15, 30, 45, 60, 90].map((value) => (
              <button key={value} type="button" className={session.availableMinutes === value ? "preset on" : "preset"} aria-pressed={session.availableMinutes === value} onClick={() => apply(String(value))}>
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error !== null && <p role="alert" id="budget-error" className="error error-on-navy"><Icon name="alert" /> {error}</p>}
    </section>
  );
}

function TimeBlocks({ plan, available }: { plan: ComparedPlan; available: number }) {
  const used = plan.plan.totalMinutes;
  const free = Math.max(available - used, 0);
  return (
    <div className="timeblocks" aria-hidden="true">
      {plan.plan.interventions.map((item) => (
        <span key={item.id} className="timeblock" style={{ flexGrow: item.durationMinutes, "--skill": skillTheme(item.skill).color } as CSSProperties}>
          {skillTheme(item.skill).glyph}
        </span>
      ))}
      {free > 0 && <span className="timeblock timeblock-free" style={{ flexGrow: free }}>libre</span>}
      {used === 0 && free === 0 && <span className="timeblock timeblock-free" style={{ flexGrow: 1 }}>sin tiempo</span>}
    </div>
  );
}

function PlanRoutes({ comparison }: { comparison: InterventionPlanComparison }) {
  const { session, setActivePlan } = useRadar();
  const relation = comparison.plansCoincide ? "=" : "≠";
  return (
    <div className="routes" role="radiogroup" aria-label="Plan activo para actividades y práctica">
      {PLAN_IDS.map((id, index) => {
        const compared = comparedPlan(comparison, id);
        const summary = planSummary(compared, session.students);
        const active = session.activePlan === id;
        return (
          <label key={id} className={active ? "route-card on" : "route-card"} style={{ "--plan": PLAN_THEME[id].color } as CSSProperties}>
            <span className="route-head">
              <input type="radio" name="active-plan" checked={active} onChange={() => setActivePlan(id)} />
              <span className="route-mark" aria-hidden="true">{PLAN_THEME[id].mark}</span>
              <strong>{PLAN_LABELS[id]}</strong>
              {active && <span className="tag tag-active">Plan activo</span>}
            </span>
            <small>{PLAN_HELP[id]}</small>
            <TimeBlocks plan={compared} available={comparison.availableMinutes} />
            <span className="route-skills">
              {summary.skills.length === 0
                ? "Ninguna competencia programada"
                : summary.skills.map((s) => (
                    <span key={s.id} className="tag"><SkillBadge id={s.id} size="sm" /> {s.name}</span>
                  ))}
            </span>
            <dl className="route-figures">
              <div><dt>Pendiente máximo</dt><dd>{decimal(summary.maxPending)}</dd></div>
              <div><dt>Pendiente medio</dt><dd>{decimal(summary.meanPending)}</dd></div>
              <div><dt>Valor neto</dt><dd>{decimal(summary.netValue)}</dd></div>
              <div><dt>Tiempo</dt><dd>{minutes(summary.totalMinutes)}</dd></div>
            </dl>
            {summary.highestPendingStudent !== null && <small>Mayor pendiente: {summary.highestPendingStudent}</small>}
            {index === 0 && <span className="route-relation" aria-hidden="true">{relation}</span>}
          </label>
        );
      })}
    </div>
  );
}

function PendingMatrix({ comparison }: { comparison: InterventionPlanComparison }) {
  const { session } = useRadar();
  const active = session.activePlan;
  const rows = pendingRows(comparison, session.students, active);
  const skills = rows[0]?.detail ?? [];
  const scheduled = comparedPlan(comparison, active).analysis.scheduledSkills;
  return (
    <>
      <ul className="legend" aria-label="Leyenda de la matriz">
        <li><i className="dot dot-need" /> Necesidad estimada que queda pendiente (más grande, más necesidad)</li>
        <li><i className="dot dot-scheduled" /> Programada en el plan activo: no significa aprendida</li>
        <li><i className="dot dot-none" /> Sin evidencia de esta competencia</li>
      </ul>
      <div className="table-scroll matrix-scroll" tabIndex={0} role="region" aria-label="Matriz de necesidad pendiente por alumno">
        <table className="matrix">
          <thead>
            <tr>
              <th scope="col">Alumno</th>
              {skills.map((skill) => (
                <th key={skill.skill} scope="col" className={scheduled.includes(skill.skill) ? "col-on" : ""} title={skill.name}>
                  <SkillBadge id={skill.skill} size="sm" />
                  <span className="sr-only">{skill.name}</span>
                </th>
              ))}
              <th scope="col"><abbr title="Índice inicial de necesidad">Inicial</abbr></th>
              <th scope="col"><span className="route-mark route-mark-sm" style={{ "--plan": PLAN_THEME.collective.color } as CSSProperties} aria-hidden="true">A</span><span className="sr-only">Pendiente con el plan colectivo</span></th>
              <th scope="col"><span className="route-mark route-mark-sm" style={{ "--plan": PLAN_THEME.pendingNeed.color } as CSSProperties} aria-hidden="true">B</span><span className="sr-only">Pendiente con el plan por necesidad</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const observed = observedBySkill(stateOf(session, row.studentId));
              return (
                <tr key={row.studentId} className={row.basedOnPriorOnly ? "row-prior" : ""}>
                  <th scope="row">
                    {row.displayName}
                    {row.basedOnPriorOnly && <small>Solo prior: sin evidencia</small>}
                  </th>
                  {row.detail.map((skill) => {
                    const isScheduled = (active === "collective" ? skill.collective : skill.pendingNeed) === "scheduled";
                    const measured = (observed[skill.skill] ?? 0) > 0;
                    return (
                      <td key={skill.skill} className={isScheduled ? "col-on" : ""}>
                        {!measured ? (
                          <><i className="dot dot-none" /><span className="sr-only">Sin evidencia{isScheduled ? ", programada" : ""}</span></>
                        ) : isScheduled ? (
                          <><i className="dot dot-scheduled" /><span className="sr-only">{percent(skill.need)}, programada</span></>
                        ) : (
                          <><i className="dot dot-need" style={{ "--size": `${8 + skill.need * 18}px` } as CSSProperties} title={percent(skill.need)} /><span className="sr-only">{percent(skill.need)}, pendiente</span></>
                        )}
                      </td>
                    );
                  })}
                  <td>{decimal(row.baseline)}</td>
                  <td className={active === "collective" ? "num-on" : ""}>{decimal(row.pendingCollective)}</td>
                  <td className={active === "pendingNeed" ? "num-on" : ""}>{decimal(row.pendingNeed)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

const PARTS = [
  { key: "preparation", label: "Preparación", color: "#002048" },
  { key: "priority", label: "Prioridad", color: "#0068C8" },
  { key: "confidence", label: "Confianza", color: "#2FB5F5" },
  { key: "coverage", label: "Cobertura", color: "#FFC629" },
] as const;

function RankingRow({ score, position, max, comparison }: { score: InterventionScore; position: number; max: number; comparison: InterventionPlanComparison }) {
  const inPlan = PLAN_IDS.filter((id) => comparedPlan(comparison, id).analysis.scheduledSkills.includes(score.skill));
  return (
    <li className="rank-row">
      <span className="rank-position">{position}</span>
      <SkillBadge id={score.skill} />
      <div className="rank-body">
        <span className="rank-title">
          <strong>{score.title}</strong>
          {inPlan.map((id) => (
            <span key={id} className="route-mark route-mark-sm" style={{ "--plan": PLAN_THEME[id].color } as CSSProperties} title={`En el ${PLAN_LABELS[id].toLowerCase()}`}>
              <span aria-hidden="true">{PLAN_THEME[id].mark}</span>
              <span className="sr-only">En el {PLAN_LABELS[id].toLowerCase()}</span>
            </span>
          ))}
        </span>
        <span className="stack" aria-hidden="true" style={{ width: `${max === 0 ? 0 : (score.benefit / max) * 100}%` }}>
          {PARTS.map((part) => (
            <i key={part.key} style={{ flexGrow: score.contributions[part.key], background: part.color }} title={`${part.label}: ${decimal(score.contributions[part.key])}`} />
          ))}
        </span>
        <small>{explainScore(score)}</small>
      </div>
      <span className="rank-value"><b>{decimal(score.netValue)}</b><small>valor neto</small></span>
    </li>
  );
}

function Ranking({ ranking, comparison }: { ranking: InterventionRanking; comparison: InterventionPlanComparison }) {
  const max = Math.max(0, ...ranking.ranking.map((s) => s.benefit));
  return (
    <>
      <ul className="legend" aria-label="Partes del beneficio">
        {PARTS.map((part) => <li key={part.key}><i className="swatch" style={{ background: part.color }} /> {part.label}</li>)}
      </ul>
      <ol className="ranking">
        {ranking.ranking.map((score, index) => (
          <RankingRow key={score.id} score={score} position={index + 1} max={max} comparison={comparison} />
        ))}
      </ol>
      <details className="more">
        <summary>Ver las cifras en una tabla</summary>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Cifras del ranking">
          <table>
            <thead>
              <tr>
                <th scope="col">Competencia</th>
                <th scope="col">Duración</th>
                <th scope="col">Necesidad</th>
                <th scope="col">Preparación</th>
                <th scope="col">Confianza</th>
                <th scope="col">Relevancia</th>
                <th scope="col">Beneficio</th>
                <th scope="col">Coste</th>
                <th scope="col">Valor neto</th>
                <th scope="col">Valor / min</th>
              </tr>
            </thead>
            <tbody>
              {ranking.ranking.map((score) => (
                <tr key={score.id}>
                  <th scope="row">{skillName(score.skill)}</th>
                  <td>{minutes(score.durationMinutes)}</td>
                  <td>{percent(score.components.need)}</td>
                  <td>{percent(score.components.preparation)}</td>
                  <td>{percent(score.components.confidence)}</td>
                  <td>{percent(score.components.relevance)}</td>
                  <td>{decimal(score.benefit)}</td>
                  <td>{decimal(score.cost)}</td>
                  <td>{decimal(score.netValue)}</td>
                  <td>{decimal(score.valuePerMinute, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

export function PlansScreen() {
  const { session, plans } = useRadar();
  const title = (
    <PageTitle
      eyebrow="Planes"
      title="Dos formas de usar el mismo tiempo"
      intro="El plan colectivo frente al que minimiza la mayor necesidad estimada pendiente, y lo que le queda pendiente a cada alumno."
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
  return (
    <>
      {title}
      <Budget />
      <section className="panel" aria-labelledby="compare-title">
        <div className="panel-head">
          <h2 id="compare-title">Comparación de planes</h2>
          {comparison.plansCoincide && !hypothetical && <span className="tag tag-active">Los dos planes coinciden</span>}
        </div>
        <p className="lead">{comparisonNarrative(comparison)}</p>
        <PlanRoutes comparison={comparison} />
        <p className="note">{comparison.disclaimer}</p>
        {comparison.warnings.length > 0 && (
          <Notice tone="warning" title={comparison.warnings.length === 1 ? "Aviso del motor:" : `${comparison.warnings.length} avisos del motor:`}>
            <ul className="notice-list">
              {comparison.warnings.map((warning, i) => (
                <li key={`${warning.code}-${warning.skill ?? ""}-${i}`}>{readableMessage(warning.message)}</li>
              ))}
            </ul>
          </Notice>
        )}
        <div className="controls">
          <a className="btn btn-primary" href="#/actividades">Actividades del plan activo</a>
          <a className="btn btn-ghost" href="#/practica">Práctica individual</a>
        </div>
      </section>
      <section className="panel" aria-labelledby="pending-title">
        <h2 id="pending-title">Lo que queda pendiente, alumno a alumno</h2>
        <p>
          Con el plan activo ({PLAN_LABELS[session.activePlan]}). Solo cuentan las
          competencias programadas directamente: no se da nada por resuelto en
          sus descendientes.
        </p>
        <PendingMatrix comparison={comparison} />
      </section>
      <section className="panel" aria-labelledby="ranking-title">
        <div className="panel-head">
          <h2 id="ranking-title">Ranking de competencias</h2>
          {hypothetical && <span className="tag tag-warn">Cálculo hipotético: solo priors</span>}
        </div>
        {hypothetical && <p>Sin respuestas no hay recomendación: este orden solo refleja los priors del modelo.</p>}
        <Ranking ranking={ranking} comparison={comparison} />
      </section>
    </>
  );
}
