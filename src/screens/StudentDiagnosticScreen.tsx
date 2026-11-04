import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KnowledgeMap, levelOf } from "../components/KnowledgeMap.tsx";
import { ReadAloud } from "../components/ReadAloud.tsx";
import { usePreferences, useRadar } from "../components/RadarProvider.tsx";
import {
  ConfirmButton,
  EmptyClassNotice,
  Metric,
  Notice,
  PageTitle,
  StudentPicker,
} from "../components/ui.tsx";
import { diagnosticView, type DiagnosticView } from "../services/diagnostic.ts";
import { percent } from "../services/format.ts";
import { stateOf } from "../services/session.ts";

function questionText(question: NonNullable<DiagnosticView["question"]>) {
  return question.format === "multipleChoice"
    ? `${question.statement} ${question.options
        .map((o, i) => `Opción ${String.fromCharCode(65 + i)}: ${o.text}.`)
        .join(" ")}`
    : question.statement;
}

function Estimates({ view }: { view: DiagnosticView }) {
  const measured = view.skills.filter((skill) => skill.hasEvidence);
  return (
    <section className="card estimates" aria-labelledby="estimates-title">
      <p className="eyebrow">ASÍ EVOLUCIONA EL DIAGNÓSTICO</p>
      <h2 id="estimates-title">Una imagen en construcción</h2>
      {!view.hasEvidence ? (
        <p>
          Todavía no hay respuestas, así que no hay evidencia sobre este alumno.
          El modelo parte de un prior del 50 % por competencia: es un punto de
          partida, no un resultado.
        </p>
      ) : (
        <p>
          Probabilidad de dominio estimada por un modelo sin calibrar. No es una
          nota.
        </p>
      )}
      {measured.length > 0 && (
        <div className="chart" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={measured} layout="vertical" margin={{ left: 8, right: 15 }}>
              <XAxis type="number" domain={[0, 1]} hide />
              <YAxis type="category" dataKey="id" width={42} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => percent(Number(v))} />
              <Bar dataKey="probability" fill="var(--mark)" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <ul className="skill-list">
        {view.skills.map((skill) => (
          <li key={skill.id}>
            <span>{skill.name}</span>
            <strong>{skill.hasEvidence ? percent(skill.probability) : "Sin evidencia"}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SkillTable({ view }: { view: DiagnosticView }) {
  return (
    <section className="card map-card" aria-labelledby="map-title">
      <p className="eyebrow">SEIS COMPETENCIAS CONECTADAS</p>
      <h2 id="map-title">Mapa de conocimientos</h2>
      <p>
        Las flechas indican prerrequisitos propuestos: son hipótesis pedagógicas,
        sin causalidad demostrada.
      </p>
      <KnowledgeMap
        skills={view.skills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          prerequisites: skill.prerequisites,
          valueText: skill.hasEvidence
            ? `${percent(skill.probability)} de dominio estimado`
            : "Sin evidencia",
          level: skill.hasEvidence ? levelOf(skill.probability) : "none",
        }))}
      />
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Estimaciones por competencia">
        <table>
          <caption className="sr-only">Estimaciones y prerrequisitos, alternativa accesible al mapa</caption>
          <thead>
            <tr>
              <th scope="col">Competencia</th>
              <th scope="col">Dominio estimado</th>
              <th scope="col">Incertidumbre</th>
              <th scope="col">Respuestas relacionadas</th>
              <th scope="col">Prerrequisitos</th>
            </tr>
          </thead>
          <tbody>
            {view.skills.map((skill) => (
              <tr key={skill.id}>
                <th scope="row">{skill.name}</th>
                <td>{skill.hasEvidence ? percent(skill.probability) : "Sin evidencia"}</td>
                <td>{skill.hasEvidence ? `${skill.uncertainty.toFixed(2)} bits` : "—"}</td>
                <td>{skill.observedResponses}</td>
                <td>{skill.prerequisites.join(", ") || "Ninguno"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Feedback({ view }: { view: DiagnosticView }) {
  if (view.feedback === null) return null;
  return (
    <section className="feedback" role="status">
      <strong>
        {view.feedback.correct ? "✓ Respuesta anterior correcta" : "✗ Respuesta anterior incorrecta"}
      </strong>
      <p>{view.feedback.explanation}</p>
    </section>
  );
}

export function StudentDiagnosticScreen() {
  const radar = useRadar();
  const { preferences } = usePreferences();
  const { session } = radar;
  const studentId = session.activeStudentId;
  const state = studentId === null ? null : stateOf(session, studentId);
  const view = useMemo(() => (state === null ? null : diagnosticView(state)), [state]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [awaitingNext, setAwaitingNext] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    setAnswer("");
    setError("");
    setAwaitingNext(false);
  }, [studentId]);

  // Tras responder, el foco pasa a la pregunta nueva.
  useEffect(() => {
    if (submitted.current && !awaitingNext) {
      submitted.current = false;
      heading.current?.focus();
    }
  }, [view?.question?.id, awaitingNext]);

  if (studentId === null || view === null) {
    return (
      <>
        <PageTitle
          eyebrow="DIAGNÓSTICO INDIVIDUAL"
          title="Entender antes de avanzar."
          intro="Elige un alumno para responder sus preguntas."
        />
        <EmptyClassNotice />
      </>
    );
  }

  const student = session.students.find((s) => s.studentId === studentId);
  const origin = session.origins[studentId];
  const focused = preferences.onePerScreen;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (studentId === null || view?.question == null) return;
    const result = radar.answer(studentId, view.question.id, answer);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    submitted.current = true;
    setAnswer("");
    setError("");
    if (focused) setAwaitingNext(true);
  }

  const question = view.question;

  return (
    <>
      <PageTitle
        eyebrow="DIAGNÓSTICO INDIVIDUAL"
        title="Entender antes de avanzar."
        intro="Responde como el alumno elegido. RADAR elige la siguiente pregunta según la información que espera obtener."
      >
        <StudentPicker />
        <ConfirmButton
          label="Reiniciar este alumno"
          confirmLabel="¿Seguro? Pulsa otra vez"
          onConfirm={() => radar.resetStudent(studentId)}
        />
      </PageTitle>
      {!focused && (
        <>
          <Notice>
            Es un diagnóstico de demostración, no un examen: la aplicación se
            ejecuta en el navegador y no protege las soluciones.
          </Notice>
          <div className="metrics">
            <Metric
              label="ALUMNO"
              value={student?.displayName ?? studentId}
              detail={`${origin?.manual ?? 0} manuales, ${origin?.simulated ?? 0} simuladas`}
            />
            <Metric
              label="RECORRIDO"
              value={<>{view.completed} <em>/ {view.total}</em></>}
              detail="Preguntas respondidas"
            />
            <Metric
              label="ACIERTOS"
              value={view.hasEvidence ? view.correct : "—"}
              detail={view.hasEvidence ? `De ${view.completed} respuestas` : "Sin respuestas"}
            />
          </div>
        </>
      )}
      {focused && (
        <p className="progress-line">
          Pregunta {Math.min(view.completed + 1, view.total)} de {view.total}
        </p>
      )}
      <div className={focused ? "diagnostic-single" : "diagnostic-grid"}>
        <section className="card question-card" aria-label="Pregunta">
          {awaitingNext ? (
            <>
              <Feedback view={view} />
              <button
                type="button"
                className="primary"
                autoFocus
                onClick={() => setAwaitingNext(false)}
              >
                {question === null ? "Ver el final" : "Siguiente pregunta →"}
              </button>
            </>
          ) : question !== null ? (
            <>
              <div className="section-heading">
                <span className="eyebrow">SIGUIENTE PREGUNTA</span>
                <span className="pill">
                  {question.format === "numeric" ? "Respuesta numérica" : "Opción múltiple"}
                </span>
              </div>
              <form onSubmit={submit} key={question.id}>
                <h2 tabIndex={-1} ref={heading}>{question.statement}</h2>
                <ReadAloud text={questionText(question)} />
                {question.format === "multipleChoice" ? (
                  <fieldset>
                    <legend className="sr-only">Elige una respuesta</legend>
                    {question.options.map((option, i) => (
                      <label className={`option ${answer === option.id ? "selected" : ""}`} key={option.id}>
                        <input
                          type="radio"
                          name="answer"
                          value={option.id}
                          checked={answer === option.id}
                          onChange={() => {
                            setAnswer(option.id);
                            setError("");
                          }}
                        />
                        <span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </fieldset>
                ) : (
                  <div className="numeric">
                    <label htmlFor="numeric-answer">Tu respuesta</label>
                    <input
                      id="numeric-answer"
                      value={answer}
                      onChange={(e) => {
                        setAnswer(e.target.value);
                        setError("");
                      }}
                      placeholder="Ej.: -3 o 2/5"
                      autoComplete="off"
                      inputMode="text"
                      aria-describedby="numeric-help"
                      aria-invalid={error !== ""}
                    />
                    <small id="numeric-help">
                      Escribe un entero o una fracción. Se aceptan fracciones equivalentes.
                    </small>
                  </div>
                )}
                {error !== "" && <p role="alert" className="error">{error}</p>}
                <div className="question-footer">
                  <span>Sin límite de tiempo</span>
                  <button className="primary" disabled={answer.trim() === ""}>
                    Enviar respuesta →
                  </button>
                </div>
              </form>
              {view.expectedInformation !== null && !focused && (
                <details>
                  <summary>¿Por qué esta pregunta?</summary>
                  <p>
                    El motor la selecciona por su ganancia de información
                    esperada: <strong>{view.expectedInformation.toFixed(3)} bits</strong>.
                    Es una expectativa del modelo, no una mejora educativa medida.
                  </p>
                </details>
              )}
            </>
          ) : (
            <>
              <div className="section-heading">
                <span className="eyebrow">RECORRIDO COMPLETADO</span>
                <span className="pill">{view.total} de {view.total}</span>
              </div>
              <h2 tabIndex={-1} ref={heading}>Ya no quedan preguntas para este alumno.</h2>
              <p>
                Ha respondido todo el banco, sin repetir ninguna pregunta. Las
                estimaciones resumen esas respuestas según el modelo; no son una
                evaluación validada.
              </p>
              <a className="primary" href="#/practica">Ir a la práctica →</a>
            </>
          )}
        </section>
        {!focused && <Estimates view={view} />}
      </div>
      {!awaitingNext && !focused && <Feedback view={view} />}
      {!focused && <SkillTable view={view} />}
    </>
  );
}
