import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KnowledgeMap, levelOf } from "../components/KnowledgeMap.tsx";
import { useRadar } from "../components/RadarProvider.tsx";
import { EmptyClassNotice, Metric, Notice, PageTitle } from "../components/ui.tsx";
import { decimal, percent } from "../services/format.ts";
import { classSkillRows, evidenceLabel } from "../services/teacher.ts";

export function TeacherScreen() {
  const { session, diagnostic } = useRadar();
  const rows = classSkillRows(diagnostic);
  const hasEvidence = diagnostic.totalResponseCount > 0;
  const title = (
    <PageTitle
      eyebrow="DIAGNÓSTICO COLECTIVO"
      title="La clase, competencia a competencia."
      intro="Resumen de las estimaciones del modelo para todos los alumnos, con su incertidumbre y sus avisos."
    />
  );
  if (diagnostic.evidenceStatus === "emptyClass")
    return <>{title}<Notice tone="warning">{diagnostic.disclaimer}</Notice><EmptyClassNotice /></>;
  const proportion =
    diagnostic.studentCount === 0
      ? null
      : 1 - diagnostic.studentsWithResponses / diagnostic.studentCount;
  return (
    <>
      {title}
      {diagnostic.warnings.map((warning) => (
        <Notice key={warning.code} tone="warning">{warning.message}</Notice>
      ))}
      <Notice>{diagnostic.disclaimer}</Notice>
      <div className="metrics">
        <Metric label="EVIDENCIA" value={`${diagnostic.studentsWithResponses} / ${diagnostic.studentCount}`} detail={evidenceLabel(diagnostic)} />
        <Metric label="RESPUESTAS" value={diagnostic.totalResponseCount} detail="No equivale a competencias medidas" />
        <Metric label="SIN RESPUESTAS" value={percent(proportion)} detail="Alumnos con solo el prior" />
      </div>
      {!hasEvidence ? (
        <section className="card empty-state">
          <h2>Aún no hay evidencia de la clase.</h2>
          <p>
            Ningún alumno tiene respuestas: cualquier cifra sería solo el prior
            del modelo, por lo que no se muestra como resultado.
          </p>
          <a className="primary" href="#/clase">Generar respuestas</a>
        </section>
      ) : (
        <>
          <section className="card" aria-labelledby="class-chart-title">
            <h2 id="class-chart-title">Dominio medio estimado</h2>
            <div className="chart chart-wide" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows.map((r) => ({ name: r.name, media: r.meanMastery }))} layout="vertical" margin={{ left: 12, right: 24 }}>
                  <CartesianGrid horizontal={false} stroke="var(--grid)" />
                  <XAxis type="number" domain={[0, 1]} tickFormatter={(v: number) => percent(v)} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={170} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [percent(Number(v)), "Dominio medio"]} />
                  <Bar dataKey="media" fill="var(--mark)" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="table-scroll" tabIndex={0} role="region" aria-labelledby="class-chart-title">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Competencia</th>
                    <th scope="col">Dominio medio</th>
                    <th scope="col">Refuerzo esperado</th>
                    <th scope="col">Bajo el umbral</th>
                    <th scope="col">Estimación incierta</th>
                    <th scope="col">Entropía media</th>
                    <th scope="col">Prerrequisitos dominados</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.skill}>
                      <th scope="row">{row.name}</th>
                      <td>{percent(row.meanMastery)}</td>
                      <td>{row.expectedReinforcementCount.toFixed(1)}</td>
                      <td>{row.belowTauCount}</td>
                      <td>{row.uncertainCount}</td>
                      <td>{decimal(row.meanEntropy, 2)} bits</td>
                      <td>{percent(row.meanPrerequisiteProbability)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="table-note">
              Refuerzo esperado es una estimación del modelo (Σ 1 − p), no un
              recuento de alumnos observados con dificultad.
            </p>
          </section>
          <section className="card map-card" aria-labelledby="class-map-title">
            <h2 id="class-map-title">Mapa de competencias de la clase</h2>
            <p>Las flechas son hipótesis pedagógicas de prerrequisito, no causalidad demostrada.</p>
            <KnowledgeMap
              skills={rows.map((row) => ({
                id: row.skill,
                name: row.name,
                prerequisites: row.prerequisites,
                valueText: `${percent(row.meanMastery)} de media estimada`,
                level: levelOf(row.meanMastery),
              }))}
            />
          </section>
          <section className="card" aria-labelledby="students-title">
            <h2 id="students-title">Por alumno</h2>
            <div className="table-scroll" tabIndex={0} role="region" aria-labelledby="students-title">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Alumno</th>
                    <th scope="col">Respuestas</th>
                    {rows.map((row) => <th key={row.skill} scope="col" title={row.name}>{row.skill}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {diagnostic.students.map((student) => (
                    <tr key={student.studentId}>
                      <th scope="row">{session.students.find((s) => s.studentId === student.studentId)?.displayName ?? student.studentId}</th>
                      <td>{student.responseCount}</td>
                      {student.skills.map((skill) => (
                        <td key={skill.skill}>
                          {student.responseCount === 0 ? "Sin evidencia" : percent(skill.masteryProbability)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
