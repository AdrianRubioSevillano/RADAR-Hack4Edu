import { useMemo, useState, type FormEvent } from "react";
import { ReactFlow, Background, Controls, MarkerType } from "@xyflow/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  startDiagnostic,
  diagnosticView,
  answerQuestion,
  type DiagnosticView,
} from "./services/diagnostic.ts";
import type { DiagnosticState } from "./services/engine.ts";
const percent = (p: number) => `${(p * 100).toFixed(0)} %`;
function KnowledgeMap({ skills }: { skills: DiagnosticView["skills"] }) {
  const positions: Record<string, { x: number; y: number } | undefined> = {
    OPS: { x: 180, y: 0 },
    NEG: { x: 0, y: 110 },
    FRA: { x: 360, y: 110 },
    JER: { x: 0, y: 220 },
    ALG: { x: 180, y: 330 },
    ECU: { x: 180, y: 440 },
  };
  const nodes = skills.map((s) => ({
    id: s.id,
    position: positions[s.id] ?? { x: 0, y: 0 },
    data: {
      label: (
        <>
          <strong>{s.name}</strong>
          <span>{percent(s.probability)} de dominio estimado</span>
        </>
      ),
    },
    style: {
      background: "#fff",
      border: "1px solid #b1c9bf",
      borderRadius: 12,
      width: 190,
      padding: 12,
    },
  }));
  const edges = skills.flatMap((s) =>
    s.prerequisites.map((id) => ({
      id: `${id}-${s.id}`,
      source: id,
      target: s.id,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#88a79c", strokeWidth: 1.6 },
    })),
  );
  return (
    <div className="map" aria-label="Mapa de prerrequisitos">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        minZoom={0.3}
      >
        <Background color="#d5e2dc" gap={22} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
export default function App() {
  const [state, setState] = useState<DiagnosticState | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"diagnostic" | "map">("diagnostic");
  const view = useMemo(() => (state ? diagnosticView(state) : null), [state]);
  function start() {
    setState(startDiagnostic());
    setAnswer("");
    setError("");
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!state || !view?.question) return;
    const result = answerQuestion(state, view.question.id, answer);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setState(result.value);
    setAnswer("");
    setError("");
  }
  return (
    <div className="shell">
      <aside>
        <a className="brand" href="#">
          <span className="logo">◉</span> RADAR
          <span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">ESPACIO DOCENTE</div>
        <nav aria-label="Principal">
          <button
            className={tab === "diagnostic" ? "active" : ""}
            onClick={() => setTab("diagnostic")}
          >
            <span>◈</span> Diagnóstico
          </button>
          <button
            className={tab === "map" ? "active" : ""}
            onClick={() => setTab("map")}
          >
            <span>⌘</span> Mapa de conocimientos
          </button>
        </nav>
        <div className="aside-note">
          <span className="status-dot" /> Motor en el navegador
          <p>
            Una pregunta cada vez.
            <br />
            Una visión más clara del aprendizaje.
          </p>
        </div>
        <div className="profile">
          <div className="avatar">D</div>
          <div>
            Espacio de demostración<small>Matemáticas · 1.º–2.º ESO</small>
          </div>
        </div>
      </aside>
      <main>
        <header>
          <div>
            RADAR <span>/</span>{" "}
            {tab === "map" ? "Mapa de conocimientos" : "Diagnóstico individual"}
          </div>
          <span className="badge">DEMO MANUAL</span>
        </header>
        <div className="content">
          <div className="title-row">
            <div>
              <p className="eyebrow">CADA RESPUESTA APORTA UNA PISTA</p>
              <h1>
                {tab === "map"
                  ? "Conecta los conocimientos."
                  : "Entender antes de avanzar."}
              </h1>
              <p className="intro">
                Explora lo que sabe un alumno y decide qué preguntar después.
              </p>
            </div>
            {state && (
              <button className="secondary" onClick={start}>
                Reiniciar diagnóstico
              </button>
            )}
          </div>
          <div className="notice">
            <span>ⓘ</span>
            <div>
              <strong>Demostración con un alumno ficticio.</strong> Las
              respuestas las introduces tú. Las estimaciones se calculan con un
              modelo experimental sin calibración ni validación docente.
            </div>
          </div>
          {!view ? (
            <section className="welcome card">
              <div className="welcome-icon">◎</div>
              <p className="eyebrow">DIAGNÓSTICO ADAPTATIVO</p>
              <h2>El punto de partida es una pregunta.</h2>
              <p>
                Responde como alumno y observa cómo se actualiza el mapa de seis
                competencias. RADAR elige la siguiente pregunta según la
                información que espera obtener.
              </p>
              <button className="primary" onClick={start}>
                Iniciar diagnóstico <span>→</span>
              </button>
              <div className="welcome-meta">
                30 preguntas disponibles <span>·</span> Sin registro{" "}
                <span>·</span> Respuestas en esta sesión
              </div>
            </section>
          ) : (
            <>
              <div className="metrics">
                <div>
                  <small>ALUMNO</small>
                  <strong>Alumno de demostración</strong>
                  <span>Sesión manual · sin guardar</span>
                </div>
                <div>
                  <small>RECORRIDO</small>
                  <strong>
                    {view.completed} <em>/ {view.total}</em>
                  </strong>
                  <span>Preguntas respondidas</span>
                </div>
                <div>
                  <small>COMPETENCIAS</small>
                  <strong>6</strong>
                  <span>Matemáticas de ESO</span>
                </div>
              </div>
              {tab === "diagnostic" ? (
                <div className="diagnostic-grid">
                  <section className="card question-card">
                    <div className="section-heading">
                      <span className="eyebrow">
                        {view.question
                          ? "SIGUIENTE PREGUNTA"
                          : "RECORRIDO COMPLETADO"}
                      </span>
                      <span className="pill">
                        {view.question?.format === "numeric"
                          ? "Respuesta numérica"
                          : view.question
                            ? "Opción múltiple"
                            : "30 de 30"}
                      </span>
                    </div>
                    {view.question ? (
                      <form onSubmit={submit} key={view.question.id}>
                        <h2 tabIndex={-1}>{view.question.statement}</h2>
                        {view.question.format === "multipleChoice" ? (
                          <fieldset>
                            <legend className="sr-only">
                              Elige una respuesta
                            </legend>
                            {view.question.options.map((option, i) => (
                              <label
                                className={`option ${answer === option.id ? "selected" : ""}`}
                                key={option.id}
                              >
                                <input
                                  type="radio"
                                  name="answer"
                                  value={option.id}
                                  checked={answer === option.id}
                                  onChange={() => {
                                    setAnswer(option.id);
                                    setError("");
                                  }}
                                  required
                                />
                                <span className="option-letter">
                                  {String.fromCharCode(65 + i)}
                                </span>
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
                              required
                            />
                            <small>
                              Escribe un entero o una fracción. Se aceptan
                              fracciones equivalentes.
                            </small>
                          </div>
                        )}
                        {error && (
                          <p role="alert" className="error">
                            {error}
                          </p>
                        )}
                        <div className="question-footer">
                          <span>Sin límite de tiempo</span>
                          <button className="primary" disabled={!answer.trim()}>
                            Enviar respuesta →
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h2>Ya has respondido todo el banco.</h2>
                        <p>
                          El mapa resume las estimaciones del modelo tras estas
                          respuestas. No constituye una evaluación validada.
                        </p>
                        <button
                          className="primary"
                          onClick={() => setTab("map")}
                        >
                          Explorar el mapa →
                        </button>
                      </>
                    )}
                    {view.expectedInformation !== null && (
                      <details>
                        <summary>¿Por qué esta pregunta?</summary>
                        <p>
                          El motor la selecciona por su ganancia de información
                          esperada:{" "}
                          <strong>
                            {view.expectedInformation.toFixed(3)} bits
                          </strong>
                          . Es una expectativa del modelo, no una mejora
                          educativa medida.
                        </p>
                      </details>
                    )}
                  </section>
                  <section className="card estimates">
                    <p className="eyebrow">ASÍ EVOLUCIONA EL DIAGNÓSTICO</p>
                    <h2>Una imagen en construcción</h2>
                    <p>
                      Probabilidad de dominio estimada. Antes de responder, el
                      modelo parte del 50 % en cada competencia.
                    </p>
                    <div className="chart" aria-hidden="true">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={view.skills}
                          layout="vertical"
                          margin={{ left: 8, right: 15 }}
                        >
                          <XAxis type="number" domain={[0, 1]} hide />
                          <YAxis
                            type="category"
                            dataKey="id"
                            width={42}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip formatter={(v) => percent(Number(v))} />
                          <Bar
                            dataKey="probability"
                            fill="#2e7565"
                            radius={[0, 5, 5, 0]}
                            barSize={16}
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="skill-list">
                      {view.skills.map((s) => (
                        <li key={s.id}>
                          <span>{s.name}</span>
                          <strong>{percent(s.probability)}</strong>
                        </li>
                      ))}
                    </ul>
                    <button
                      className="text-button"
                      onClick={() => setTab("map")}
                    >
                      Ver dependencias en el mapa ↗
                    </button>
                  </section>
                </div>
              ) : (
                <section className="card map-card">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">SEIS COMPETENCIAS CONECTADAS</p>
                      <h2>Mapa de conocimientos</h2>
                    </div>
                    <span className="pill">Estimaciones actuales</span>
                  </div>
                  <p>
                    Las flechas indican prerrequisitos propuestos. Son hipótesis
                    pedagógicas, sin causalidad demostrada.
                  </p>
                  <KnowledgeMap skills={view.skills} />
                  <table>
                    <caption className="sr-only">
                      Estimaciones y prerrequisitos, alternativa accesible al
                      mapa
                    </caption>
                    <thead>
                      <tr>
                        <th>Competencia</th>
                        <th>Dominio estimado</th>
                        <th>Incertidumbre</th>
                        <th>Prerrequisitos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {view.skills.map((s) => (
                        <tr key={s.id}>
                          <th>{s.name}</th>
                          <td>{percent(s.probability)}</td>
                          <td>{s.uncertainty.toFixed(2)} bits</td>
                          <td>{s.prerequisites.join(", ") || "Ninguno"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}
              {view.feedback && (
                <section className="feedback" role="status">
                  <strong>
                    {view.feedback.correct
                      ? "✓ Respuesta anterior correcta"
                      : "Respuesta anterior incorrecta"}
                  </strong>
                  <p>{view.feedback.explanation}</p>
                </section>
              )}
            </>
          )}
          <div className="pending">
            <div>
              <strong>El siguiente paso, con evidencia.</strong>
              <p>
                Diagnóstico colectivo, intervenciones y comparativas: pendientes
                de integrar con el motor.
              </p>
            </div>
            <span className="pill">En desarrollo</span>
          </div>
          <footer>
            RADAR · Hacer visible el aprendizaje.
            <span>Prototipo experimental · Hack4Edu</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
