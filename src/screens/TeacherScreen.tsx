import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SkillBadge } from "../components/art.tsx";
import { ClassRadar } from "../components/ClassRadar.tsx";
import { KnowledgeMap } from "../components/KnowledgeMap.tsx";
import { useRadar } from "../components/RadarProvider.tsx";
import { skillTheme } from "../components/theme.ts";
import { EmptyClassNotice, EmptyState, Notice, PageTitle, Stat } from "../components/ui.tsx";
import { decimal, percent, percentBounded } from "../services/format.ts";
import { classHeadline, classRadarView } from "../services/radarView.ts";
import { classSkillRows, evidenceLabel } from "../services/teacher.ts";

export function TeacherScreen() {
  const { session, diagnostic } = useRadar();
  const rows = classSkillRows(diagnostic);
  const radar = useMemo(() => classRadarView(session, diagnostic), [session, diagnostic]);
  const headline = classHeadline(diagnostic);
  const hasEvidence = diagnostic.totalResponseCount > 0;
  const noEvidenceTitle = (
    <PageTitle
      eyebrow="Radar de clase"
      title="El radar está en silencio"
      intro="Resumen de las estimaciones del modelo para toda la clase."
    />
  );
  if (diagnostic.evidenceStatus === "emptyClass")
    return <>{noEvidenceTitle}<Notice tone="warning">{diagnostic.disclaimer}</Notice><EmptyClassNotice /></>;
  const proportion =
    diagnostic.studentCount === 0 ? null : 1 - diagnostic.studentsWithResponses / diagnostic.studentCount;
  if (!hasEvidence)
    return (
      <>
        {noEvidenceTitle}
        {diagnostic.warnings.map((w) => <Notice key={w.code} tone="warning">{w.message}</Notice>)}
        <EmptyState
          title="Aún no hay evidencia de la clase."
          action={<a className="btn btn-primary" href="#/clase">Generar respuestas</a>}
        >
          Ningún alumno tiene respuestas: cualquier cifra sería solo el prior del modelo, por lo que no se muestra como resultado.
        </EmptyState>
      </>
    );
  return (
    <>
      <PageTitle
        eyebrow="Radar de clase"
        title={headline === null ? "Radar de clase" : `Mayor necesidad media: ${headline.name}`}
      />
      {diagnostic.warnings.map((w) => <Notice key={w.code} tone="warning">{w.message}</Notice>)}
      <section className="panel panel-navy panel-flush" aria-labelledby="radar-title">
        <h2 id="radar-title" className="sr-only">Radar de la clase</h2>
        <ClassRadar view={radar}>
          <div className="radar-stats">
            <Stat label="Con respuestas" value={`${diagnostic.studentsWithResponses} / ${diagnostic.studentCount}`} detail={evidenceLabel(diagnostic)} />
            <Stat label="Respuestas" value={diagnostic.totalResponseCount} detail="No son competencias medidas" />
            <Stat label="Sin respuestas" value={percent(proportion)} detail="Solo el prior" />
          </div>
        </ClassRadar>
      </section>
      <p className="disclaimer">{diagnostic.disclaimer}</p>
      <section className="panel" aria-labelledby="class-chart-title">
        <h2 id="class-chart-title">Competencia a competencia</h2>
        <div className="skill-meters">
          {rows.map((row) => (
            <div className="skill-meter" key={row.skill}>
              <SkillBadge id={row.skill} />
              <div>
                <span className="skill-meter-head">
                  <strong>{row.name}</strong>
                  <b>{percent(row.meanMastery)}</b>
                </span>
                <span className="meter meter-lg" style={{ "--value": row.meanMastery ?? 0, "--skill": skillTheme(row.skill).color } as React.CSSProperties} />
                <small>{row.belowTauCount} bajo el umbral · {row.uncertainCount} con estimación incierta</small>
              </div>
            </div>
          ))}
        </div>
        <details className="more">
          <summary>Ver gráfico y tabla completa</summary>
          <div className="chart" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart accessibilityLayer={false} data={rows.map((r) => ({ name: r.name, media: r.meanMastery }))} layout="vertical" margin={{ left: 12, right: 24 }}>
                <CartesianGrid horizontal={false} stroke="var(--ring)" />
                <XAxis type="number" domain={[0, 1]} tickFormatter={(v: number) => percent(v)} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={170} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [percent(Number(v)), "Dominio medio"]} />
                <Bar dataKey="media" fill="var(--blue)" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-scroll" tabIndex={0} role="region" aria-label="Resumen por competencia">
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
          <p className="note">Refuerzo esperado es una estimación del modelo (Σ 1 − p), no un recuento de alumnos observados con dificultad.</p>
        </details>
      </section>
      <section className="panel" aria-labelledby="class-map-title">
        <h2 id="class-map-title">Camino entre competencias</h2>
        <p>Las flechas son hipótesis pedagógicas de prerrequisito, no causalidad demostrada.</p>
        <KnowledgeMap
          skills={rows.map((row) => ({
            id: row.skill,
            name: row.name,
            prerequisites: row.prerequisites,
            valueText: `${percent(row.meanMastery)} de media estimada`,
            value: row.meanMastery,
          }))}
        />
      </section>
      <section className="panel" aria-labelledby="students-title">
        <h2 id="students-title">Alumno a alumno</h2>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabla de estimaciones por alumno">
          <table className="heat">
            <thead>
              <tr>
                <th scope="col">Alumno</th>
                <th scope="col">Resp.</th>
                {rows.map((row) => <th key={row.skill} scope="col" title={row.name}><SkillBadge id={row.skill} size="sm" /><span className="sr-only">{row.name}</span></th>)}
              </tr>
            </thead>
            <tbody>
              {diagnostic.students.map((student) => (
                <tr key={student.studentId}>
                  <th scope="row">{session.students.find((s) => s.studentId === student.studentId)?.displayName ?? student.studentId}</th>
                  <td>{student.responseCount}</td>
                  {student.skills.map((skill) => (
                    <td key={skill.skill} className={student.responseCount === 0 ? "heat-none" : ""} style={student.responseCount === 0 ? undefined : ({ "--value": skill.masteryProbability } as React.CSSProperties)}>
                      {student.responseCount === 0 ? "Sin evidencia" : percentBounded(skill.masteryProbability)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
