import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ReadAloud } from "../components/ReadAloud.tsx";
import { usePreferences, useRadar } from "../components/RadarProvider.tsx";
import {
  EmptyClassNotice,
  Notice,
  PageTitle,
  StudentPicker,
} from "../components/ui.tsx";
import { decimal, percent } from "../services/format.ts";
import {
  checkPracticeAnswer,
  revealPracticeSolution,
  selectPractice,
  type PracticeSolution,
  type PublicExercise,
} from "../services/practice.ts";
import { stateOf } from "../services/session.ts";
import { PLAN_LABELS, comparedPlan } from "../services/teacher.ts";

const SOURCE_LABELS = {
  diagnosticRepeat: "Repaso de una pregunta fallada",
  template: "Ejercicio de plantilla",
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
  const [solution, setSolution] = useState<
    (PracticeSolution & { solved: boolean }) | null
  >(null);

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
      recordPractice(studentId, exercise.id, (r) => ({
        ...r,
        attempts: r.attempts + 1,
        solved: true,
      }));
    onNext();
  }

  return (
    <section className="card question-card" aria-label="Ejercicio de práctica">
      <div className="section-heading">
        <span className="eyebrow">{exercise.skillName.toUpperCase()}</span>
        <span className="pill">{SOURCE_LABELS[exercise.source]}</span>
      </div>
      <form onSubmit={check}>
        <h2 tabIndex={-1}>{exercise.statement}</h2>
        <ReadAloud text={exercise.statement} />
        {exercise.format === "multipleChoice" ? (
          <fieldset disabled={solution !== null}>
            <legend className="sr-only">Elige una respuesta</legend>
            {exercise.options.map((option, i) => (
              <label className={`option ${answer === option.id ? "selected" : ""}`} key={option.id}>
                <input
                  type="radio"
                  name="practice-answer"
                  checked={answer === option.id}
                  onChange={() => {
                    setAnswer(option.id);
                    setMessage(null);
                  }}
                />
                <span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                <span>{option.text}</span>
              </label>
            ))}
          </fieldset>
        ) : (
          <div className="numeric">
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
        {message !== null && <p role="status" className="error">{message}</p>}
        {hints > 0 && (
          <ol className="hints" aria-label="Pistas">
            {exercise.hints.slice(0, hints).map((hint) => <li key={hint}>{hint}</li>)}
          </ol>
        )}
        {solution === null ? (
          <div className="question-footer practice-actions">
            <button
              type="button"
              className="secondary"
              disabled={hints >= exercise.hints.length}
              onClick={() => {
                setHints(hints + 1);
                recordPractice(studentId, exercise.id, (r) => ({ ...r, hintsUsed: r.hintsUsed + 1 }));
              }}
            >
              Pedir pista ({hints}/{exercise.hints.length})
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setSolution({ ...revealPracticeSolution(exercise.id), solved: false });
                recordPractice(studentId, exercise.id, (r) => ({ ...r, revealed: true }));
              }}
            >
              Ver solución
            </button>
            <button type="button" className="text-button" onClick={onSkip}>Saltar</button>
            <button className="primary" disabled={answer.trim() === ""}>Comprobar</button>
          </div>
        ) : (
          <div role="status" className="feedback">
            <strong>{solution.solved ? "✓ Correcto" : `Solución: ${solution.answerText}`}</strong>
            <p>{solution.explanation}</p>
            <button type="button" className="primary" autoFocus onClick={next}>
              Siguiente ejercicio →
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
      ? (comparedPlan(plans.comparison, session.activePlan).analysis.students.find(
          (s) => s.studentId === studentId,
        ) ?? null)
      : null;
    return selectPractice(
      stateOf(session, studentId),
      need,
      session.practice[studentId] ?? {},
    );
  }, [studentId, plans, session]);

  const intro = (
    <PageTitle
      eyebrow="PRÁCTICA INDIVIDUAL"
      title="Practicar no es evaluar."
      intro="Ejercicios elegidos según la necesidad estimada que el plan deja pendiente. Las respuestas, pistas y repeticiones de esta pantalla no cambian el diagnóstico."
    >
      {studentId !== null && <StudentPicker />}
    </PageTitle>
  );

  if (studentId === null || selection === null)
    return <>{intro}<EmptyClassNotice /></>;

  const available =
    selection.status === "ready"
      ? selection.exercises.filter((e) => !skipped.includes(e.id))
      : [];
  const current = available[0] ?? null;
  const skippedAll =
    selection.status === "ready" && selection.exercises.length > 0 && current === null;

  return (
    <>
      {intro}
      <Notice title="Separada del diagnóstico.">
        Esta práctica no genera evidencia para el modelo. Contenido sin revisión
        docente. Plan activo: {PLAN_LABELS[session.activePlan]}.
      </Notice>
      {selection.status !== "ready" ? (
        <section className="card empty-state">
          <h2>Todavía no hay práctica para este alumno.</h2>
          <p>{selection.message}</p>
          <a className="primary" href="#/diagnostico">Ir al diagnóstico</a>
        </section>
      ) : (
        <div className={preferences.onePerScreen ? "diagnostic-single" : "diagnostic-grid"}>
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
              <section className="card empty-state">
                <h2>Has saltado todos los ejercicios propuestos.</h2>
                <button type="button" className="primary" onClick={() => setSkipped([])}>
                  Volver a verlos
                </button>
              </section>
            )}
          </div>
          {!preferences.onePerScreen && (
            <section className="card estimates" aria-labelledby="why-title">
              <p className="eyebrow">POR QUÉ ESTOS EJERCICIOS</p>
              <h2 id="why-title">Necesidad estimada</h2>
              {selection.targets.length === 0 ? (
                <p>Ninguna competencia medida supera el umbral.</p>
              ) : (
                <ul className="skill-list">
                  {selection.targets.map((target) => (
                    <li key={target.skill}>
                      <span>
                        {target.name}
                        <small>
                          {target.reason === "pendingAfterPlan"
                            ? `Pendiente tras el plan · índice ${decimal(target.pending)}`
                            : "Programada en el plan: también se trabaja en grupo"}
                        </small>
                      </span>
                      <strong>{percent(target.need)}</strong>
                    </li>
                  ))}
                </ul>
              )}
              {selection.unmeasured.length > 0 && (
                <p>
                  Sin evidencia, por lo que no se eligen ejercicios:{" "}
                  {selection.unmeasured.map((s) => s.name).join(", ")}.
                </p>
              )}
              <p>
                Las preguntas del banco que este alumno aún no ha visto se
                reservan para el diagnóstico.
              </p>
            </section>
          )}
        </div>
      )}
    </>
  );
}
