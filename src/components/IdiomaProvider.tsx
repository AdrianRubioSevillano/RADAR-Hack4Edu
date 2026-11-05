import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { IDIOMA_DEFECTO, crearT, type Idioma, type Traductor } from "../i18n/index.ts";
import { almacenDisponible } from "../services/almacen.ts";
import { cargarIdioma, guardarIdioma } from "../services/idioma.ts";

export interface ContextoIdioma {
  readonly idioma: Idioma;
  readonly t: Traductor;
  readonly cambiarIdioma: (idioma: Idioma) => void;
}

// Sin proveedor (pantallas sueltas en los tests) se habla el idioma por defecto.
const Contexto = createContext<ContextoIdioma>({ idioma: IDIOMA_DEFECTO, t: crearT(IDIOMA_DEFECTO), cambiarIdioma: () => undefined });

export function IdiomaProvider({ children, inicial }: { children: ReactNode; inicial?: Idioma }) {
  const [idioma, setIdioma] = useState<Idioma>(() => inicial ?? cargarIdioma(almacenDisponible()));

  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);

  const valor = useMemo(
    () => ({
      idioma,
      t: crearT(idioma),
      cambiarIdioma: (nuevo: Idioma) => {
        guardarIdioma(almacenDisponible(), nuevo);
        setIdioma(nuevo);
      },
    }),
    [idioma],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useIdioma(): ContextoIdioma {
  return useContext(Contexto);
}
