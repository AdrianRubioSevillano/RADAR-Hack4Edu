import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { almacenDisponible, cargarClase, claseTrasCambio, guardarClase } from "../services/almacen.ts";
import type { Clase } from "../services/clase.ts";
import { crearDemo } from "../services/demo.ts";

export interface ContextoClase {
  readonly clase: Clase;
  readonly actualizar: (cambio: (clase: Clase) => Clase) => void;
  readonly restablecer: () => void;
  readonly profesorDesbloqueado: boolean;
  readonly desbloquear: () => void;
  readonly bloquear: () => void;
}

const Contexto = createContext<ContextoClase | null>(null);

export function ClaseProvider({ children, desbloqueado = false }: { children: ReactNode; desbloqueado?: boolean }) {
  const [clase, setClase] = useState<Clase>(() => cargarClase(almacenDisponible()) ?? crearDemo());
  // El desbloqueo vive solo en memoria: al recargar o salir se vuelve a pedir el PIN.
  const [profesorDesbloqueado, setDesbloqueado] = useState(desbloqueado);

  useEffect(() => guardarClase(almacenDisponible(), clase), [clase]);

  // Guardar lo mismo que ya hay no lanza `storage`, así que dos pestañas no se responden sin fin.
  useEffect(() => {
    const alCambiar = (evento: StorageEvent) => {
      const nueva = claseTrasCambio(evento.key, almacenDisponible());
      if (nueva !== null) setClase(nueva);
    };
    window.addEventListener("storage", alCambiar);
    return () => window.removeEventListener("storage", alCambiar);
  }, []);

  const actualizar = useCallback((cambio: (c: Clase) => Clase) => setClase(cambio), []);
  const restablecer = useCallback(() => setClase((actual) => ({ ...crearDemo(), pinHash: actual.pinHash })), []);
  const desbloquear = useCallback(() => setDesbloqueado(true), []);
  const bloquear = useCallback(() => setDesbloqueado(false), []);

  const valor = useMemo(
    () => ({ clase, actualizar, restablecer, profesorDesbloqueado, desbloquear, bloquear }),
    [clase, actualizar, restablecer, profesorDesbloqueado, desbloquear, bloquear],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useClase(): ContextoClase {
  const valor = useContext(Contexto);
  if (valor === null) throw new Error("Falta ClaseProvider");
  return valor;
}
