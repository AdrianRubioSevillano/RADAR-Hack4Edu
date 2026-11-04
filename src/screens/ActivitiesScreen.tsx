import { useRadar } from "../components/RadarProvider.tsx";
import { EmptyClassNotice, Notice, PageTitle } from "../components/ui.tsx";
import { collectiveActivities } from "../services/collective.ts";
import { minutes } from "../services/format.ts";
import { PLAN_LABELS, comparedPlan } from "../services/teacher.ts";

export function ActivitiesScreen() {
  const { session, plans, diagnostic } = useRadar();
  const title = (
    <PageTitle
      eyebrow="PRÁCTICA COLECTIVA"
      title="Actividades para lo priorizado."
      intro="Una actividad por competencia del plan activo. Cambia de plan en la pantalla Planes."
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
        <section className="card empty-state">
          <h2>El plan activo no tiene competencias.</h2>
          <p>
            {plans.ranking.basis === "hypotheticalPriorsOnly"
              ? "Hay que recoger respuestas antes de programar nada."
              : "Con este presupuesto no se programa ninguna competencia. Ajusta el tiempo en la pantalla Planes."}
          </p>
          <a className="primary" href="#/planes">Ir a Planes</a>
        </section>
      ) : (
        activities.map((item) => (
          <section className="card activity" key={item.skill} aria-labelledby={`activity-${item.skill}`}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">{item.skillName.toUpperCase()}</p>
                <h2 id={`activity-${item.skill}`}>{item.activity?.title ?? item.skillName}</h2>
              </div>
              <span className="pill">{minutes(item.durationMinutes)}</span>
            </div>
            {item.shortage !== null && <Notice tone="warning">{item.shortage}</Notice>}
            {item.warnings.map((warning) => <Notice key={warning} tone="warning">{warning}</Notice>)}
            {item.activity !== null && (
              <>
                <p>{item.activity.goal}</p>
                <ol>{item.activity.steps.map((step) => <li key={step}>{step}</li>)}</ol>
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
                      {exercise.statement}{" "}
                      <details className="inline-details">
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
                  <small>Hipótesis del banco, no errores observados en esta clase.</small>
                </div>
              )}
            </div>
          </section>
        ))
      )}
    </>
  );
}
