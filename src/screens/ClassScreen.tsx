import { useState } from "react";
import { useRadar } from "../components/RadarProvider.tsx";
import { ConfirmButton, Metric, Notice, PageTitle } from "../components/ui.tsx";
import { RADAR_QUESTION_BANK } from "../services/engine.ts";
import { stateOf } from "../services/session.ts";
import { evidenceLabel } from "../services/teacher.ts";

const TOTAL = RADAR_QUESTION_BANK.questions.length;
const TARGETS = [4, 6, 9, 12, TOTAL];

export function ClassScreen() {
  const radar = useRadar();
  const { session, diagnostic, progress, isEmptyClass } = radar;
  const [target, setTarget] = useState(9);
  const [count, setCount] = useState(session.students.length);
  const total = session.students.length;
  const who = Math.min(count === 0 ? total : count, total);
  return (
    <>
      <PageTitle
        eyebrow="CLASE SIMULADA"
        title="Treinta alumnos ficticios."
        intro="Prepara una clase de demostración, responde como uno de sus alumnos o genera respuestas sintéticas para el resto."
      />
      <Notice title="Todos los datos son sintéticos.">
        Los alumnos y sus respuestas simuladas se generan con la semilla{" "}
        {session.seed}. No corresponden a ninguna persona real, y las
        estimaciones proceden de un modelo sin calibrar ni validar.
      </Notice>
      <div className="metrics">
        <Metric label="ALUMNOS" value={total} detail="Ficticios" />
        <Metric
          label="CON RESPUESTAS"
          value={<>{diagnostic.studentsWithResponses} <em>/ {total}</em></>}
          detail={evidenceLabel(diagnostic)}
        />
        <Metric
          label="RESPUESTAS"
          value={diagnostic.totalResponseCount}
          detail="Registradas en total"
        />
      </div>
      <section className="card" aria-labelledby="sim-title">
        <h2 id="sim-title">Generar respuestas sintéticas</h2>
        <p>
          Cada alumno sigue su propio diagnóstico adaptativo con el motor real.
          Sus respuestas salen del modelo de simulación: no son respuestas de
          personas. Las respuestas ya registradas se conservan.
        </p>
        {isEmptyClass ? (
          <Notice tone="warning" title="Clase vacía de prueba.">
            No hay alumnos a los que simular. Esta prueba no se guarda.
          </Notice>
        ) : (
          <div className="controls">
            <label className="picker">
              <span>Respuestas por alumno</span>
              <select value={target} onChange={(e) => setTarget(Number(e.target.value))}>
                {TARGETS.map((value) => (
                  <option key={value} value={value}>
                    {value === TOTAL ? `Todas (${TOTAL})` : `Hasta ${value}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="picker">
              <span>Alumnos</span>
              <select value={who} onChange={(e) => setCount(Number(e.target.value))}>
                <option value={total}>Toda la clase</option>
                <option value={Math.floor(total / 2)}>Solo la primera mitad</option>
              </select>
            </label>
            {progress === null ? (
              <button type="button" className="primary" onClick={() => radar.simulate(target, who)}>
                Simular respuestas
              </button>
            ) : (
              <button type="button" className="secondary" onClick={radar.cancelSimulation}>
                Cancelar
              </button>
            )}
          </div>
        )}
        {progress !== null && (
          <div role="status">
            <progress value={progress.done} max={progress.total} aria-label="Progreso de la simulación" />{" "}
            {progress.done} de {progress.total} alumnos
          </div>
        )}
        {radar.simulationError !== null && (
          <Notice tone="error" title="La simulación se ha detenido.">
            {radar.simulationError}
          </Notice>
        )}
        <div className="controls secondary-controls">
          <ConfirmButton
            label="Reiniciar toda la demo"
            confirmLabel="¿Seguro? Pulsa otra vez"
            onConfirm={radar.resetAll}
          />
          <button type="button" className="secondary" onClick={() => radar.setEmptyClass(!isEmptyClass)}>
            {isEmptyClass ? "Restaurar los 30 alumnos" : "Probar con clase vacía"}
          </button>
        </div>
      </section>
      {total > 0 && (
        <section className="card" aria-labelledby="roster-title">
          <h2 id="roster-title">Alumnos</h2>
          <div className="table-scroll" tabIndex={0} role="region" aria-labelledby="roster-title">
            <table>
              <thead>
                <tr>
                  <th scope="col">Alumno</th>
                  <th scope="col">Respuestas</th>
                  <th scope="col">Origen</th>
                  <th scope="col">Estado</th>
                  <th scope="col"><span className="sr-only">Acción</span></th>
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
                      <td>
                        {responses === 0
                          ? "—"
                          : `${origin?.manual ?? 0} manuales, ${origin?.simulated ?? 0} simuladas`}
                      </td>
                      <td>
                        {responses === 0
                          ? "Sin respuestas"
                          : responses === TOTAL
                            ? "Banco agotado"
                            : "En curso"}
                      </td>
                      <td>
                        <a
                          href="#/diagnostico"
                          className="text-button"
                          onClick={() => radar.selectStudent(student.studentId)}
                        >
                          Abrir<span className="sr-only"> diagnóstico de {student.displayName}</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
