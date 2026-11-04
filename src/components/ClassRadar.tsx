import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { percentBounded } from "../services/format.ts";
import {
  RADAR_RADIUS,
  needRadius,
  polarPoint,
  type ClassRadarView,
  type RadarBlip,
} from "../services/radarView.ts";
import { SkillBadge } from "./art.tsx";
import { useRadar } from "./RadarProvider.tsx";
import { skillTheme } from "./theme.ts";

const RINGS = [0.25, 0.5, 0.75, 1];
const SWEEP_SECONDS = 7;

function sectorPath(startDeg: number, endDeg: number): string {
  const a = polarPoint(startDeg, 1);
  const b = polarPoint(endDeg, 1);
  return `M50 50L${a.x} ${a.y}A${RADAR_RADIUS} ${RADAR_RADIUS} 0 0 1 ${b.x} ${b.y}Z`;
}

// Pantalla del radar. Cada punto es un alumno, en el sector de su mayor necesidad
// medida y más lejos del centro cuanto mayor es. El teclado usa los seis sectores.
export function ClassRadar({ view, children }: { view: ClassRadarView; children?: ReactNode }) {
  const { selectStudent } = useRadar();
  const busiest = useMemo(
    () => view.sectors.reduce((best, s) => (s.blips.length > best.blips.length ? s : best), view.sectors[0]!),
    [view],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<RadarBlip | null>(null);
  const sector = view.sectors.find((s) => s.skill === selected) ?? busiest;
  const polygon = view.sectors
    .filter((s) => s.meanNeed !== null)
    .map((s) => {
      const p = polarPoint(s.midAngle, needRadius(s.meanNeed ?? 0));
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <div className="radar-console">
      <div className="scope-wrap">
        <div className="scope" aria-hidden="true">
          <svg viewBox="0 0 100 100" className="scope-grid">
            <circle cx="50" cy="50" r={RADAR_RADIUS + 3} className="scope-bezel" />
            <circle cx="50" cy="50" r={RADAR_RADIUS} className="scope-face" />
            {view.sectors.map((s, index) => (
              <path
                key={s.skill}
                d={sectorPath(index * 60, index * 60 + 60)}
                className={s.skill === sector.skill ? "scope-sector active" : "scope-sector"}
                style={{ "--skill": skillTheme(s.skill).color } as CSSProperties}
              />
            ))}
            {RINGS.map((ring) => (
              <circle key={ring} cx="50" cy="50" r={RADAR_RADIUS * needRadius(ring)} className="scope-ring" />
            ))}
            {polygon !== "" && <polygon points={polygon} className="scope-shape" />}
          </svg>
          <div className="scope-sweep" style={{ "--sweep": `${SWEEP_SECONDS}s` } as CSSProperties} />
        </div>
        {view.blips.map((blip) => (
          <button
            key={blip.studentId}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className={blip.skill === sector.skill ? "blip in-sector" : "blip"}
            style={{
              left: `${blip.x}%`,
              top: `${blip.y}%`,
              "--delay": `${(blip.angle / 360) * SWEEP_SECONDS}s`,
              "--sweep": `${SWEEP_SECONDS}s`,
            } as CSSProperties}
            onMouseEnter={() => setHover(blip)}
            onMouseLeave={() => setHover(null)}
            onClick={() => setSelected(blip.skill)}
          />
        ))}
        {hover !== null && (
          <div className="blip-tip" style={{ left: `${hover.x}%`, top: `${hover.y}%` }} aria-hidden="true">
            <strong>{hover.displayName}</strong>
            Mayor necesidad: {view.sectors.find((s) => s.skill === hover.skill)?.name}, {percentBounded(hover.need)}
          </div>
        )}
        {view.sectors.map((s) => {
          const p = polarPoint(s.midAngle, 1.11);
          const active = s.skill === sector.skill;
          return (
            <button
              key={s.skill}
              type="button"
              className={active ? "sector-tag active" : "sector-tag"}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              aria-pressed={active}
              onClick={() => setSelected(s.skill)}
            >
              <SkillBadge id={s.skill} size="sm" />
              <b>{s.blips.length}</b>
              <span className="sr-only"> alumnos con su mayor necesidad en {s.name}</span>
            </button>
          );
        })}
      </div>
      <div className="radar-side">
        {children}
        <p className="radar-legend">
          Cada punto es un alumno, en el sector de su <strong>mayor necesidad medida</strong>.
          Cuanto más lejos del centro, mayor es su necesidad media estimada. La forma
          cian es la necesidad media de la clase. Los números de cada sector son alumnos.
        </p>
        <h3 aria-live="polite">
          <SkillBadge id={sector.skill} /> {sector.name}
        </h3>
        {sector.blips.length === 0 ? (
          <p>Ningún alumno tiene aquí su mayor necesidad medida.</p>
        ) : (
          <ul className="radar-list">
            {[...sector.blips]
              .sort((a, b) => b.need - a.need)
              .map((blip) => (
                <li key={blip.studentId}>
                  <a href="#/diagnostico" onClick={() => selectStudent(blip.studentId)}>
                    {blip.displayName}
                    <span className="sr-only">, abrir diagnóstico</span>
                  </a>
                  <span>{percentBounded(blip.need)}</span>
                </li>
              ))}
          </ul>
        )}
        {view.withoutEvidence.length > 0 && (
          <p className="radar-out">
            <strong>{view.withoutEvidence.length} alumnos fuera del radar:</strong>{" "}
            sin respuestas no hay evidencia que dibujar.
          </p>
        )}
      </div>
    </div>
  );
}
