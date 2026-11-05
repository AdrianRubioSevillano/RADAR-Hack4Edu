import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import type { Color } from "../core/tipos.ts";
import { Icon, Mascot } from "./art.tsx";

export const ETIQUETA_COLOR: Readonly<Record<Color, string>> = {
  verde: "Lo domina",
  amarillo: "Aún no está claro",
  rojo: "Necesita refuerzo",
};

const SIMBOLO: Readonly<Record<Color, string>> = { verde: "✓", amarillo: "?", rojo: "!" };

// El color nunca va solo: cada estado lleva símbolo propio y texto accesible.
export function Semaforo({ color, conTexto = false }: { color: Color; conTexto?: boolean }) {
  return (
    <span className={`semaforo semaforo-${color}`}>
      <span className="semaforo-punto" aria-hidden="true">{SIMBOLO[color]}</span>
      {conTexto ? <span>{ETIQUETA_COLOR[color]}</span> : <span className="sr-only">{ETIQUETA_COLOR[color]}</span>}
    </span>
  );
}

// Dos pulsaciones en lugar de un diálogo: se usa igual con teclado.
export function ConfirmButton({ label, confirmLabel, onConfirm, className = "boton boton-suave" }: { label: string; confirmLabel: string; onConfirm: () => void; className?: string }) {
  const [armado, setArmado] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onBlur={() => setArmado(false)}
      onClick={() => {
        if (armado) {
          setArmado(false);
          onConfirm();
        } else setArmado(true);
      }}
    >
      {armado ? confirmLabel : label}
    </button>
  );
}

export function Titulo({ children }: { children: ReactNode }) {
  return <h1 id="titulo" tabIndex={-1}>{children}</h1>;
}

export function Volver({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="boton boton-suave boton-volver" href={href}>
      <Icon name="back" /> {children}
    </a>
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, { fallo: boolean }> {
  override state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  override render() {
    if (!this.state.fallo) return this.props.children;
    return (
      <section className="aviso-vacio" role="alert">
        <Mascot mood="try" size={110} />
        <h1>Algo no ha ido bien.</h1>
        <p>Tus datos siguen guardados. Vuelve al inicio para seguir.</p>
        <button
          type="button"
          className="boton boton-principal"
          onClick={() => {
            this.setState({ fallo: false });
            this.props.onReset();
          }}
        >
          Volver al inicio
        </button>
      </section>
    );
  }
}
