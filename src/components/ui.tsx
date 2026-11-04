import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import { describeEngineError } from "../services/errors.ts";
import { useRadar } from "./RadarProvider.tsx";

export function Notice({
  title,
  children,
  tone = "info",
}: {
  title?: string;
  children: ReactNode;
  tone?: "info" | "warning" | "error";
}) {
  const icon = tone === "info" ? "ⓘ" : "!";
  return (
    <div className={`notice notice-${tone}`} role={tone === "error" ? "alert" : undefined}>
      <span aria-hidden="true">{icon}</span>
      <div>
        {title !== undefined && <strong>{title} </strong>}
        {children}
      </div>
    </div>
  );
}

export function SyntheticBadge() {
  return <span className="badge">DATOS SINTÉTICOS</span>;
}

export function PageTitle({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children?: ReactNode;
}) {
  return (
    <div className="title-row">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 tabIndex={-1} id="page-title">
          {title}
        </h1>
        <p className="intro">{intro}</p>
      </div>
      {children !== undefined && <div className="title-actions">{children}</div>}
    </div>
  );
}

export function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail: string;
}) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  );
}

// Dos pulsaciones en lugar de un diálogo: se usa igual con teclado.
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  className = "secondary",
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onBlur={() => setArmed(false)}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}

export function StudentPicker({ label = "Alumno" }: { label?: string }) {
  const { session, selectStudent } = useRadar();
  return (
    <label className="picker">
      <span>{label}</span>
      <select
        value={session.activeStudentId ?? ""}
        onChange={(event) => selectStudent(event.target.value)}
      >
        {session.students.map((student) => (
          <option key={student.studentId} value={student.studentId}>
            {student.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}

export function EmptyClassNotice() {
  return (
    <section className="card empty-state">
      <h2>No hay alumnos en esta clase.</h2>
      <p>
        Sin alumnos no hay estimaciones ni planes. Restaura la clase simulada
        desde la pantalla Clase.
      </p>
      <a className="primary" href="#/clase">
        Ir a Clase
      </a>
    </section>
  );
}

export class ErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { message: string | null }
> {
  override state = { message: null as string | null };

  static getDerivedStateFromError(error: unknown) {
    return { message: describeEngineError(error) };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  override render() {
    if (this.state.message === null) return this.props.children;
    return (
      <section className="card empty-state" role="alert">
        <h2>No se ha podido mostrar esta pantalla.</h2>
        <p>{this.state.message}</p>
        <button
          type="button"
          className="primary"
          onClick={() => {
            this.setState({ message: null });
            this.props.onReset();
          }}
        >
          Reiniciar la demo
        </button>
      </section>
    );
  }
}
