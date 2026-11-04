import type { CSSProperties } from "react";
import { SkillBadge } from "../components/art.tsx";
import { useRadar } from "../components/RadarProvider.tsx";
import { skillTheme } from "../components/theme.ts";
import { EmptyClassNotice, EmptyState, Notice, PageTitle } from "../components/ui.tsx";
import { collectiveActivities } from "../services/collective.ts";
import { minutes } from "../services/format.ts";
import { PLAN_LABELS, comparedPlan } from "../services/teacher.ts";

export function ActivitiesScreen() {
  const { session, plans, diagnostic } = useRadar();
  const title = (
    <PageTitle
      eyebrow="Actividades"
      title="La sesión de hoy, en bloques"
      intro="Una actividad por competencia del plan activo. El plan se cambia en Planes."
    />
  );
  if (session.students.length === 0) return <>{title}<EmptyClassNotice /></>;
  if (!plans.ok) return <>{title}<Notice tone="error">{plans.message}</Notice></>;
  const compared = comparedPlan(plans.comparison, session.activePlan);
  const activities = collectiveActivities(compared.plan, diagnostic, plans.ranking);
  return (
    <>
      {title}
      <Notice title="Contenido sin revisión docente.">
        Plan activo: {PLAN_LABELS[session.activePlan]}, {minutes(compared.plan.totalMinutes)}.
        Son propuestas de la aplicación. Programarlas no significa que se
        aprendan, y el motor no evalúa su eficacia.
      </Notice>
      {activities.length === 0 ? (
        <EmptyState
          title="El plan activo no tiene competencias."
          action={<a className="btn btn-primary" href="#/planes">Ir a Planes</a>}
        >
          {plans.ranking.basis === "hypotheticalPriorsOnly"
            ? "Hay que recoger respuestas antes de programar nada."
            : "Con este presupuesto no se programa ninguna competencia. Ajusta el tiempo en Planes."}
        </EmptyState>
      ) : (
        <ol className="agenda">
          {activities.map((item, index) => (
            <li key={item.skill} style={{ "--skill": skillTheme(item.skill).color } as CSSProperties}>
              <div className="agenda-time">
                <span>Bloque {index + 1}</span>
                <strong>{minutes(item.durationMinutes)}</strong>
              </div>
              <section className="activity" aria-labelledby={`activity-${item.skill}`}>
                <header>
                  <SkillBadge id={item.skill} size="lg" />
                  <div>
                    <p className="eyebrow">{item.skillName}</p>
                    <h2 id={`activity-${item.skill}`}>{item.activity?.title ?? item.skillName}</h2>
                  </div>
                </header>
                {item.shortage !== null && <Notice tone="warning">{item.shortage}</Notice>}
                {item.warnings.map((warning) => <Notice key={warning} tone="warning">{warning}</Notice>)}
                {item.activity !== null && (
                  <>
                    <p className="lead">{item.activity.goal}</p>
                    <ol className="steps">{item.activity.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                  </>
                )}
                <p>
                  Alumnos bajo el umbral según la estimación:{" "}
                  <strong>{item.belowThresholdCount ?? "No disponible"}</strong>.
                </p>
                <div className="activity-columns">
                  <div>
                    <h3>Ejercicios para el grupo</h3>
                    <ul>
                      {item.exercises.map((exercise) => (
                        <li key={exercise.id}>
                          {exercise.statement}
                          <details className="reveal">
                            <summary>Solución para docente</summary>
                            {exercise.answer}
                          </details>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {item.typicalErrors.length > 0 && (
                    <div>
                      <h3>Errores típicos previstos en el banco</h3>
                      <ul>{item.typicalErrors.map((error) => <li key={error}>{error}</li>)}</ul>
                      <p className="note">Hipótesis del banco, no errores observados en esta clase.</p>
                    </div>
                  )}
                </div>
              </section>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
