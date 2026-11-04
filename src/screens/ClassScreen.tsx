import { useState } from "react";
import { Avatar, Icon, Speech } from "../components/art.tsx";
import { useRadar } from "../components/RadarProvider.tsx";
import { ConfirmButton, Notice, PageTitle } from "../components/ui.tsx";
import { RADAR_QUESTION_BANK } from "../services/engine.ts";
import { originText } from "../services/format.ts";
import { stateOf } from "../services/session.ts";
import { evidenceLabel } from "../services/teacher.ts";

const TOTAL = RADAR_QUESTION_BANK.questions.length;
const TARGETS = [4, 6, 9, 12, TOTAL];

function statusOf(responses: number) {
  if (responses === 0) return "Sin respuestas";
  return responses === TOTAL ? "Banco agotado" : "En curso";
}

function Seat({ studentId, displayName, index }: { studentId: string; displayName: string; index: number }) {
  const { session, selectStudent } = useRadar();
  const responses = stateOf(session, studentId).responses.length;
  const origin = session.origins[studentId];
  const progress = responses / TOTAL;
  return (
    <li>
      <a
        className={responses === 0 ? "seat seat-empty" : "seat"}
        href="#/diagnostico"
        onClick={() => selectStudent(studentId)}
      >
        <Avatar index={index + 1} />
        <span className="seat-name">{displayName.replace("Alumno ficticio ", "Nº ")}</span>
        <span className="seat-bar" style={{ "--value": progress } as React.CSSProperties} />
        <span className="seat-count">{responses === 0 ? "—" : responses}</span>
        <span className="sr-only">
          {displayName}. {statusOf(responses)}: {originText(origin?.manual ?? 0, origin?.simulated ?? 0)}. Abrir diagnóstico.
        </span>
      </a>
    </li>
  );
}

export function ClassScreen() {
  const radar = useRadar();
  const { session, diagnostic, progress, isEmptyClass, plans } = radar;
  const [target, setTarget] = useState(9);
  const [half, setHalf] = useState(false);
  const total = session.students.length;
  const who = half ? Math.floor(total / 2) : total;
  const hasResponses = diagnostic.totalResponseCount > 0;
  const hasPlan = plans.ok && plans.ranking.plan.interventions.length > 0;
  const steps = [
    { label: "Genera respuestas", href: "#sim-title", done: hasResponses },
    { label: "Mira el radar", href: "#/docente", done: false },
    { label: "Compara los planes", href: "#/planes", done: false },
    { label: "Reparte la práctica", href: "#/actividades", done: false },
  ];
  return (
    <>
      <PageTitle
        eyebrow="Mi clase · semilla fija"
        title={total === 0 ? "Clase vacía" : `${total} alumnos en el radar`}
        intro="Una clase ficticia de 1.º–2.º de ESO para probar RADAR de principio a fin."
      />
      <Notice title="Todos los datos son sintéticos.">
        Alumnos y respuestas simuladas salen de la semilla {session.seed}. No
        corresponden a ninguna persona, y las estimaciones proceden de un modelo
        sin calibrar ni validar.
      </Notice>
      <div className="class-grid">
        <section className="panel panel-navy sim-panel" aria-labelledby="sim-title">
          <Speech mood={hasResponses ? "cheer" : "hello"} size={84}>
            {hasResponses
              ? `${diagnostic.studentsWithResponses} de ${total} alumnos tienen respuestas y ya hay ${diagnostic.totalResponseCount} registradas.`
              : "Aún no hay respuestas. Genéralas o abre un pupitre y responde tú."}
          </Speech>
          <h2 id="sim-title" tabIndex={-1}>Generar respuestas sintéticas</h2>
          <p>
            Cada alumno hace su diagnóstico adaptativo con el motor real. Las
            respuestas salen del modelo de simulación, no de personas, y las que
            ya existen se conservan.
          </p>
          {isEmptyClass ? (
            <Notice tone="warning" title="Clase vacía de prueba.">
              No hay alumnos a los que simular. Esta prueba no se guarda.
            </Notice>
          ) : (
            <div className="controls">
              <label className="field">
                <span>Respuestas por alumno</span>
                <select value={target} onChange={(e) => setTarget(Number(e.target.value))}>
                  {TARGETS.map((value) => (
                    <option key={value} value={value}>
                      {value === TOTAL ? `Todas (${TOTAL})` : `Hasta ${value}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Alumnos</span>
                <select value={half ? "half" : "all"} onChange={(e) => setHalf(e.target.value === "half")}>
                  <option value="all">Toda la clase</option>
                  <option value="half">Solo la primera mitad</option>
                </select>
              </label>
              {progress === null ? (
                <button type="button" className="btn btn-primary" onClick={() => radar.simulate(target, who)}>
                  Simular respuestas
                </button>
              ) : (
                <button type="button" className="btn btn-ghost" onClick={radar.cancelSimulation}>Cancelar</button>
              )}
            </div>
          )}
          {progress !== null && (
            <div role="status" className="sim-progress">
              <progress value={progress.done} max={progress.total} aria-label="Progreso de la simulación" />
              {progress.done} de {progress.total} alumnos
            </div>
          )}
          {radar.simulationError !== null && (
            <Notice tone="error" title="La simulación se ha detenido.">{radar.simulationError}</Notice>
          )}
          <div className="controls controls-quiet">
            <ConfirmButton label="Reiniciar la demo" confirmLabel="¿Seguro? Pulsa otra vez" onConfirm={radar.resetAll} />
            <button type="button" className="btn btn-ghost" onClick={() => radar.setEmptyClass(!isEmptyClass)}>
              {isEmptyClass ? "Restaurar los 30 alumnos" : "Probar con clase vacía"}
            </button>
          </div>
        </section>
        <div className="class-side">
          <section className="panel" aria-labelledby="route-title">
            <h2 id="route-title">Recorrido de la demo</h2>
            <p className="evidence-line">{evidenceLabel(diagnostic)}</p>
            <ol className="route">
              {steps.map((step, index) => (
                <li key={step.label} className={step.done ? "done" : ""}>
                  <span className="route-dot" aria-hidden="true">
                    {step.done ? <Icon name="check" size={18} /> : index + 1}
                  </span>
                  <a href={step.href}>{step.label}</a>
                  {step.done && <span className="sr-only"> (hecho)</span>}
                </li>
              ))}
            </ol>
            {hasResponses && !hasPlan && (
              <p className="evidence-line">Hay respuestas, pero aún no hay plan: revisa el presupuesto en Planes.</p>
            )}
          </section>
          {total > 0 && (
            <section className="panel classroom" aria-labelledby="roster-title">
              <div className="blackboard">
                <h2 id="roster-title">Pupitres</h2>
                <span>Abre uno para responder como ese alumno</span>
              </div>
              <ul className="seats">
                {session.students.map((student, index) => (
                  <Seat key={student.studentId} {...student} index={index} />
                ))}
              </ul>
              <details className="more">
                <summary>Ver la clase como tabla</summary>
                <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabla de alumnos">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Alumno</th>
                        <th scope="col">Respuestas</th>
                        <th scope="col">Origen</th>
                        <th scope="col">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.students.map((student) => {
                        const responses = stateOf(session, student.studentId).responses.length;
                        const origin = session.origins[student.studentId];
                        return (
                          <tr key={student.studentId}>
                            <th scope="row">{student.displayName}</th>
                            <td>{responses}</td>
                            <td>{responses === 0 ? "—" : originText(origin?.manual ?? 0, origin?.simulated ?? 0)}</td>
                            <td>{statusOf(responses)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
