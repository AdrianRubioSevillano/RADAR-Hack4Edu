import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Avatar, Icon, Speech, SkillBadge } from "../components/art.tsx";
import { KnowledgeMap } from "../components/KnowledgeMap.tsx";
import { ReadAloud } from "../components/ReadAloud.tsx";
import { usePreferences, useRadar } from "../components/RadarProvider.tsx";
import { ConfirmButton, EmptyClassNotice, PageTitle, Stat, StudentPicker } from "../components/ui.tsx";
import { diagnosticView, type DiagnosticView } from "../services/diagnostic.ts";
import { originText, percent, percentBounded } from "../services/format.ts";
import { stateOf } from "../services/session.ts";

function questionText(question: NonNullable<DiagnosticView["question"]>) {
  return question.format === "multipleChoice"
    ? `${question.statement} ${question.options
        .map((o, i) => `Opción ${String.fromCharCode(65 + i)}: ${o.text}.`)
        .join(" ")}`
    : question.statement;
}

export function Trail({ done, total }: { done: number; total: number }) {
  return (
    <div className="trail" role="img" aria-label={`${done} de ${total} preguntas respondidas`}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={index < done ? "on" : index === done ? "now" : ""} />
      ))}
    </div>
  );
}

export function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 14 }, (_, index) => <i key={index} style={{ "--i": index } as React.CSSProperties} />)}
    </div>
  );
}

function ModelPanel({ view }: { view: DiagnosticView }) {
  const measured = view.skills.filter((skill) => skill.hasEvidence);
  return (
    <details className="more teacher-peek">
      <summary>Para docentes: cómo va la estimación del modelo</summary>
      {!view.hasEvidence ? (
        <p>
          Todavía no hay respuestas, así que no hay evidencia sobre este alumno.
          El modelo parte de un prior del 50 % por competencia: es un punto de
          partida, no un resultado.
        </p>
      ) : (
        <p>Probabilidad de dominio estimada por un modelo sin calibrar. No es una nota.</p>
      )}
      <div className="peek-grid">
        <ul className="skill-rows">
          {view.skills.map((skill) => (
            <li key={skill.id}>
              <SkillBadge id={skill.id} size="sm" />
              <span>{skill.name}</span>
              <strong>{skill.hasEvidence ? percentBounded(skill.probability) : "Sin evidencia"}</strong>
            </li>
          ))}
        </ul>
        {measured.length > 0 && (
          <div className="chart chart-sm" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart accessibilityLayer={false} data={measured} layout="vertical" margin={{ left: 8, right: 15 }}>
                <XAxis type="number" domain={[0, 1]} hide />
                <YAxis type="category" dataKey="id" width={42} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => percent(Number(v))} />
                <Bar dataKey="probability" fill="var(--blue)" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <h3>Camino entre competencias</h3>
      <p>Las flechas son hipótesis pedagógicas, sin causalidad demostrada.</p>
      <KnowledgeMap
        skills={view.skills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          prerequisites: skill.prerequisites,
          valueText: skill.hasEvidence ? `${percentBounded(skill.probability)} de dominio estimado` : "Sin evidencia",
          value: skill.hasEvidence ? skill.probability : null,
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
                <td>{skill.hasEvidence ? percentBounded(skill.probability) : "Sin evidencia"}</td>
                <td>{skill.hasEvidence ? `${skill.uncertainty.toFixed(2)} bits` : "—"}</td>
                <td>{skill.observedResponses}</td>
                <td>{skill.prerequisites.join(", ") || "Ninguno"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
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
  const advanced = useRef(false);

  useEffect(() => {
    setAnswer("");
    setError("");
    setAwaitingNext(false);
  }, [studentId]);

  // Tras pasar de la corrección, el foco va a la pregunta nueva.
  useEffect(() => {
    if (advanced.current && !awaitingNext) {
      advanced.current = false;
      heading.current?.focus();
    }
  }, [awaitingNext]);

  if (studentId === null || view === null)
    return (
      <>
        <PageTitle eyebrow="Diagnóstico" title="Sin alumnos" intro="Elige un alumno para responder sus preguntas." />
        <EmptyClassNotice />
      </>
    );

  const index = session.students.findIndex((s) => s.studentId === studentId);
  const student = session.students[index];
  const origin = session.origins[studentId];
  const focused = preferences.onePerScreen;
  const question = view.question;
  const number = Math.min(view.completed + (awaitingNext ? 0 : 1), view.total);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (studentId === null || view?.question == null) return;
    const result = radar.answer(studentId, view.question.id, answer);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setAnswer("");
    setError("");
    setAwaitingNext(true);
  }

  return (
    <div className="quest">
      <div className="quest-head">
        <div className="quest-who">
          <Avatar index={index + 1} size={56} />
          <PageTitle
            eyebrow={student?.displayName ?? studentId}
            title={question === null && !awaitingNext ? "¡Banco terminado!" : `Pregunta ${number}`}
          />
        </div>
        {!focused && (
          <div className="page-actions">
            <StudentPicker />
            <ConfirmButton label="Reiniciar" confirmLabel="¿Seguro? Pulsa otra vez" onConfirm={() => radar.resetStudent(studentId)} />
          </div>
        )}
      </div>
      <Trail done={view.completed} total={view.total} />
      <section className="quest-stage" aria-label={awaitingNext ? "Corrección" : "Pregunta"}>
        {awaitingNext && view.feedback !== null ? (
          <>
            {view.feedback.correct && <Confetti />}
            <Speech mood={view.feedback.correct ? "cheer" : "try"} size={120}>
              <strong className="bubble-title" role="status">
                {view.feedback.correct ? "¡Respuesta correcta!" : "Esta vez no era esa."}
              </strong>
              {view.feedback.explanation}
            </Speech>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              autoFocus
              onClick={() => {
                advanced.current = true;
                setAwaitingNext(false);
              }}
            >
              {question === null ? "Ver el final" : "Siguiente pregunta"} <Icon name="arrow" />
            </button>
          </>
        ) : question !== null ? (
          <>
            <Speech mood="think" size={84}>
              {question.format === "numeric"
                ? "Escribe un entero o una fracción. Las fracciones equivalentes valen."
                : "Elige una opción. No hay límite de tiempo."}
            </Speech>
            <form onSubmit={submit} key={question.id}>
              <h2 tabIndex={-1} ref={heading} className="statement">{question.statement}</h2>
              <ReadAloud text={questionText(question)} />
              {question.format === "multipleChoice" ? (
                <fieldset className="choices">
                  <legend className="sr-only">Elige una respuesta</legend>
                  {question.options.map((option, i) => (
                    <label className={answer === option.id ? "choice on" : "choice"} key={option.id}>
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
                      <span className="choice-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                      <span>{option.text}</span>
                    </label>
                  ))}
                </fieldset>
              ) : (
                <div className="answer-field">
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
                    aria-describedby={error === "" ? undefined : "answer-error"}
                    aria-invalid={error !== ""}
                  />
                </div>
              )}
              {error !== "" && <p role="alert" id="answer-error" className="error"><Icon name="alert" /> {error}</p>}
              <div className="quest-actions">
                <button className="btn btn-primary btn-lg" disabled={answer.trim() === ""}>
                  Enviar respuesta <Icon name="arrow" />
                </button>
              </div>
            </form>
            {view.expectedInformation !== null && !focused && (
              <details className="more">
                <summary>¿Por qué esta pregunta?</summary>
                <p>
                  El motor la selecciona por su ganancia de información esperada:{" "}
                  <strong>{view.expectedInformation.toFixed(3)} bits</strong>. Es una
                  expectativa del modelo, no una mejora educativa medida.
                </p>
              </details>
            )}
          </>
        ) : (
          <>
            <Speech mood="cheer" size={120}>
              <strong className="bubble-title">Ya no quedan preguntas para este alumno.</strong>
              Ha respondido todo el banco, sin repetir ninguna pregunta. Las
              estimaciones resumen esas respuestas según el modelo; no son una
              evaluación validada.
            </Speech>
            <h2 tabIndex={-1} ref={heading} className="sr-only">Recorrido completado</h2>
            <a className="btn btn-primary btn-lg" href="#/practica">Ir a la práctica <Icon name="arrow" /></a>
          </>
        )}
      </section>
      {!focused && (
        <>
          <div className="stats stats-quiet">
            <Stat label="Respondidas" value={`${view.completed} / ${view.total}`} detail={originText(origin?.manual ?? 0, origin?.simulated ?? 0)} />
            <Stat label="Aciertos" value={view.hasEvidence ? view.correct : "—"} detail={view.hasEvidence ? `De ${view.completed} respuestas` : "Sin respuestas"} />
          </div>
          <ModelPanel view={view} />
          <p className="disclaimer">
            Es un diagnóstico de demostración, no un examen: la aplicación se
            ejecuta en el navegador y no protege las soluciones.
          </p>
        </>
      )}
    </div>
  );
}
