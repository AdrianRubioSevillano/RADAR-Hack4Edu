import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import { describeEngineError } from "../services/errors.ts";
import { Icon, Mascot } from "./art.tsx";
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
  return (
    <div className={`notice notice-${tone}`} role={tone === "error" ? "alert" : undefined}>
      <Icon name={tone === "info" ? "info" : "alert"} />
      <div>
        {title !== undefined && <strong>{title} </strong>}
        {children}
      </div>
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 tabIndex={-1} id="page-title">{title}</h1>
        {intro !== undefined && <p className="intro">{intro}</p>}
      </div>
      {children !== undefined && <div className="page-actions">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, detail }: { label: string; value: ReactNode; detail: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-detail">{detail}</span>
    </div>
  );
}

// Dos pulsaciones en lugar de un diálogo: se usa igual con teclado.
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  className = "btn btn-ghost",
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
    <label className="field">
      <span>{label}</span>
      <select value={session.activeStudentId ?? ""} onChange={(event) => selectStudent(event.target.value)}>
        {session.students.map((student) => (
          <option key={student.studentId} value={student.studentId}>{student.displayName}</option>
        ))}
      </select>
    </label>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="empty-state">
      <Mascot mood="think" size={104} />
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
        {action}
      </div>
    </section>
  );
}

export function EmptyClassNotice() {
  return (
    <EmptyState
      title="No hay alumnos en esta clase."
      action={<a className="btn btn-primary" href="#/clase">Ir a Mi clase</a>}
    >
      Sin alumnos no hay estimaciones ni planes. Restaura la clase simulada desde Mi clase.
    </EmptyState>
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
      <section className="empty-state" role="alert">
        <Mascot mood="try" size={104} />
        <div>
          <h2>No se ha podido mostrar esta pantalla.</h2>
          <p>{this.state.message}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              this.setState({ message: null });
              this.props.onReset();
            }}
          >
            Reiniciar la demo
          </button>
        </div>
      </section>
    );
  }
}
