import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import type { Color } from "../core/tipos.ts";
import { Icon, Mascot } from "./art.tsx";
import { useIdioma } from "./IdiomaProvider.tsx";

const SIMBOLO: Readonly<Record<Color, string>> = { verde: "✓", amarillo: "?", rojo: "!" };

// El color nunca va solo: cada estado lleva símbolo propio y texto accesible.
export function Semaforo({ color, conTexto = false }: { color: Color; conTexto?: boolean }) {
  const { t } = useIdioma();
  const etiqueta = t(`semaforo.${color}`);
  return (
    <span className={`semaforo semaforo-${color}`}>
      <span className="semaforo-punto" aria-hidden="true">{SIMBOLO[color]}</span>
      {conTexto ? <span>{etiqueta}</span> : <span className="sr-only">{etiqueta}</span>}
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

function Fallo({ onVolver }: { onVolver: () => void }) {
  const { t } = useIdioma();
  return (
    <section className="aviso-vacio" role="alert">
      <Mascot mood="try" size={110} />
      <h1>{t("error.titulo")}</h1>
      <p>{t("error.texto")}</p>
      <button type="button" className="boton boton-principal" onClick={onVolver}>{t("error.boton")}</button>
    </section>
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
      <Fallo
        onVolver={() => {
          this.setState({ fallo: false });
          this.props.onReset();
        }}
      />
    );
  }
}
