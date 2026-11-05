import { Icon } from "./art.tsx";
import { useIdioma } from "./IdiomaProvider.tsx";

// Teclado en pantalla: botones grandes y sin depender del teclado del sistema.
export function TecladoNumerico({ onTecla, onBorrar, extras = [], etiqueta }: { onTecla: (tecla: string) => void; onBorrar: () => void; extras?: readonly string[]; etiqueta: string }) {
  const { t } = useIdioma();
  const teclas = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  return (
    <div className="teclado" role="group" aria-label={etiqueta}>
      {teclas.map((n) => (
        <button key={n} type="button" className="tecla" onClick={() => onTecla(n)}>{n}</button>
      ))}
      {extras.map((n) => (
        <button key={n} type="button" className="tecla" onClick={() => onTecla(n)} aria-label={t(n === "," ? "tecla.coma" : "tecla.fraccion")}>{n}</button>
      ))}
      <button type="button" className="tecla" onClick={() => onTecla("0")}>0</button>
      <button type="button" className="tecla tecla-borrar" onClick={onBorrar} aria-label={t("tecla.borrar")}>
        <Icon name="erase" size={28} />
      </button>
    </div>
  );
}
