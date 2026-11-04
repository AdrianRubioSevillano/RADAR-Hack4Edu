import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Avatar, Icon, Speech, SkillBadge } from "../components/art.tsx";
import { ReadAloud } from "../components/ReadAloud.tsx";
import { usePreferences, useRadar } from "../components/RadarProvider.tsx";
import { EmptyClassNotice, EmptyState, Notice, PageTitle, StudentPicker } from "../components/ui.tsx";
import { decimal, percentBounded } from "../services/format.ts";
import {
  checkPracticeAnswer,
  revealPracticeSolution,
  selectPractice,
  type PracticeSolution,
  type PublicExercise,
} from "../services/practice.ts";
import { stateOf } from "../services/session.ts";
import { PLAN_LABELS, comparedPlan } from "../services/teacher.ts";
import { Confetti } from "./StudentDiagnosticScreen.tsx";

const SOURCE_LABELS = {
  diagnosticRepeat: "Repaso de una pregunta fallada",
  template: "Ejercicio de práctica",
} as const;

function Exercise({
  exercise,
  studentId,
  onNext,
  onSkip,
}: {
  exercise: PublicExercise;
  studentId: string;
  onNext: () => void;
  onSkip: () => void;
}) {
  const { recordPractice } = useRadar();
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [hints, setHints] = useState(0);
  const [solution, setSolution] = useState<(PracticeSolution & { solved: boolean }) | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  function check(event: FormEvent) {
    event.preventDefault();
    const result = checkPracticeAnswer(exercise.id, answer);
    if (result.status === "invalid") {
      setMessage(result.message);
      return;
    }
    if (result.status === "incorrect") {
      recordPractice(studentId, exercise.id, (r) => ({ ...r, attempts: r.attempts + 1 }));
      setMessage("Todavía no. Puedes volver a intentarlo o pedir una pista.");
      return;
    }
    setSolution({ ...result, solved: true });
    setMessage(null);
  }

  // El registro se escribe al pasar al siguiente: al resolverse sale de la lista.
  function next() {
    if (solution?.solved === true)
      recordPractice(studentId, exercise.id, (r) => ({ ...r, attempts: r.attempts + 1, solved: true }));
    onNext();
  }

  return (
    <section className="quest-stage" aria-label="Ejercicio de práctica">
      {solution?.solved === true && <Confetti />}
      {solution !== null ? (
        <Speech mood={solution.solved ? "cheer" : "hello"} size={104}>
          <strong className="bubble-title" role="status">
            {solution.solved ? "¡Lo tienes!" : `Solución: ${solution.answerText}`}
          </strong>
          {solution.explanation}
        </Speech>
      ) : hints > 0 ? (
        <Speech mood="hello" size={84}>
          <ol className="hints" aria-label="Pistas">
            {exercise.hints.slice(0, hints).map((hint) => <li key={hint}>{hint}</li>)}
          </ol>
        </Speech>
      ) : (
        <Speech mood="think" size={84}>
          Prueba las veces que quieras: esto es práctica, no cuenta para el diagnóstico.
        </Speech>
      )}
      <div className="exercise-tags">
        <span className="tag"><SkillBadge id={exercise.skill} size="sm" /> {exercise.skillName}</span>
        <span className="tag">{SOURCE_LABELS[exercise.source]}</span>
      </div>
      <form onSubmit={check}>
        <h2 tabIndex={-1} ref={heading} className="statement">{exercise.statement}</h2>
        <ReadAloud text={exercise.statement} />
        {exercise.format === "multipleChoice" ? (
          <fieldset className="choices" disabled={solution !== null}>
            <legend className="sr-only">Elige una respuesta</legend>
            {exercise.options.map((option, i) => (
              <label className={answer === option.id ? "choice on" : "choice"} key={option.id}>
                <input
                  type="radio"
                  name="practice-answer"
                  checked={answer === option.id}
                  onChange={() => {
                    setAnswer(option.id);
                    setMessage(null);
                  }}
                />
                <span className="choice-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                <span>{option.text}</span>
              </label>
            ))}
          </fieldset>
        ) : (
          <div className="answer-field">
            <label htmlFor="practice-answer">Tu respuesta</label>
            <input
              id="practice-answer"
              value={answer}
              disabled={solution !== null}
              onChange={(e) => {
                setAnswer(e.target.value);
                setMessage(null);
              }}
              placeholder="Ej.: -3 o 2/5"
              autoComplete="off"
            />
          </div>
        )}
        {message !== null && <p role="status" className="error"><Icon name="info" /> {message}</p>}
        {solution === null ? (
          <div className="quest-actions">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={hints >= exercise.hints.length}
              onClick={() => {
                setHints(hints + 1);
                recordPractice(studentId, exercise.id, (r) => ({ ...r, hintsUsed: r.hintsUsed + 1 }));
              }}
            >
              <Icon name="hint" /> Pedir pista ({hints}/{exercise.hints.length})
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSolution({ ...revealPracticeSolution(exercise.id), solved: false });
                recordPractice(studentId, exercise.id, (r) => ({ ...r, revealed: true }));
              }}
            >
              Ver solución
            </button>
            <button type="button" className="link" onClick={onSkip}>Saltar</button>
            <button className="btn btn-primary btn-lg push" disabled={answer.trim() === ""}>Comprobar</button>
          </div>
        ) : (
          <div className="quest-actions">
            <button type="button" className="btn btn-primary btn-lg push" autoFocus onClick={next}>
              Siguiente ejercicio <Icon name="arrow" />
            </button>
          </div>
        )}
      </form>
    </section>
  );
}

export function PracticeScreen() {
  const radar = useRadar();
  const { preferences } = usePreferences();
  const { session, plans } = radar;
  const studentId = session.activeStudentId;
  const [skipped, setSkipped] = useState<readonly string[]>([]);
  const [round, setRound] = useState(0);

  useEffect(() => setSkipped([]), [studentId]);

  const selection = useMemo(() => {
    if (studentId === null) return null;
    const need = plans.ok
      ? (comparedPlan(plans.comparison, session.activePlan).analysis.students.find((s) => s.studentId === studentId) ?? null)
      : null;
    return selectPractice(stateOf(session, studentId), need, session.practice[studentId] ?? {});
  }, [studentId, plans, session]);

  if (studentId === null || selection === null)
    return (
      <>
        <PageTitle eyebrow="Práctica" title="Sin alumnos" />
        <EmptyClassNotice />
      </>
    );

  const index = session.students.findIndex((s) => s.studentId === studentId);
  const student = session.students[index];
  const available = selection.status === "ready" ? selection.exercises.filter((e) => !skipped.includes(e.id)) : [];
  const current = available[0] ?? null;
  const skippedAll = selection.status === "ready" && selection.exercises.length > 0 && current === null;
  const focused = preferences.onePerScreen;
  const solved = Object.values(session.practice[studentId] ?? {}).filter((r) => r.solved).length;

  return (
    <div className="quest">
      <div className="quest-head">
        <div className="quest-who">
          <Avatar index={index + 1} size={56} />
          <PageTitle eyebrow={student?.displayName ?? studentId} title="Practicar no es evaluar" />
        </div>
        {!focused && <div className="page-actions"><StudentPicker /></div>}
      </div>
      <Notice title="Separada del diagnóstico.">
        Respuestas, pistas y repeticiones no cambian las estimaciones. Contenido
        sin revisión docente. Plan activo: {PLAN_LABELS[session.activePlan]}.
      </Notice>
      {selection.status !== "ready" ? (
        <EmptyState
          title="Todavía no hay práctica para este alumno."
          action={<a className="btn btn-primary" href="#/diagnostico">Ir al diagnóstico</a>}
        >
          {selection.message}
        </EmptyState>
      ) : (
        <div className={focused ? "" : "practice-grid"}>
          <div>
            {selection.message !== null && <Notice>{selection.message}</Notice>}
            {selection.shortage !== null && (
              <Notice tone="warning" title="Ejercicios insuficientes.">{selection.shortage}</Notice>
            )}
            {current !== null && (
              <Exercise
                key={`${current.id}-${round}`}
                exercise={current}
                studentId={studentId}
                onNext={() => setRound(round + 1)}
                onSkip={() => setSkipped([...skipped, current.id])}
              />
            )}
            {skippedAll && (
              <EmptyState
                title="Has saltado todos los ejercicios propuestos."
                action={<button type="button" className="btn btn-primary" onClick={() => setSkipped([])}>Volver a verlos</button>}
              >
                Puedes retomarlos cuando quieras.
              </EmptyState>
            )}
          </div>
          {!focused && (
            <aside className="panel backpack" aria-labelledby="why-title">
              <h2 id="why-title">Por qué estos ejercicios</h2>
              <p className="note">Resueltos en esta práctica: {solved}</p>
              {selection.targets.length === 0 ? (
                <p>Ninguna competencia medida supera el umbral.</p>
              ) : (
                <ul className="skill-rows">
                  {selection.targets.map((target) => (
                    <li key={target.skill}>
                      <SkillBadge id={target.skill} size="sm" />
                      <span>
                        {target.name}
                        <small>
                          {target.reason === "pendingAfterPlan"
                            ? `Pendiente tras el plan · índice ${decimal(target.pending)}`
                            : "Programada en el plan: también se trabaja en grupo"}
                        </small>
                      </span>
                      <strong>{percentBounded(target.need)}</strong>
                    </li>
                  ))}
                </ul>
              )}
              {selection.unmeasured.length > 0 && (
                <p className="note">
                  Sin evidencia, por lo que no se eligen ejercicios:{" "}
                  {selection.unmeasured.map((s) => s.name).join(", ")}.
                </p>
              )}
              <p className="note">Las preguntas del banco que este alumno aún no ha visto se reservan para el diagnóstico.</p>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
