import { Icon } from "./art.tsx";

// Teclado en pantalla: botones grandes y sin depender del teclado del sistema.
export function TecladoNumerico({ onTecla, onBorrar, extras = [], etiqueta }: { onTecla: (tecla: string) => void; onBorrar: () => void; extras?: readonly string[]; etiqueta: string }) {
  const teclas = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  return (
    <div className="teclado" role="group" aria-label={etiqueta}>
      {teclas.map((t) => (
        <button key={t} type="button" className="tecla" onClick={() => onTecla(t)}>{t}</button>
      ))}
      {extras.map((t) => (
        <button key={t} type="button" className="tecla" onClick={() => onTecla(t)} aria-label={t === "," ? "Coma" : "Barra de fracción"}>{t}</button>
      ))}
      <button type="button" className="tecla" onClick={() => onTecla("0")}>0</button>
      <button type="button" className="tecla tecla-borrar" onClick={onBorrar} aria-label="Borrar">
        <Icon name="erase" size={28} />
      </button>
    </div>
  );
}
