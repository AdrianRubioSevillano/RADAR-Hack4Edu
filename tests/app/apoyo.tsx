import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { vi } from "vitest";
import { Vista } from "../../src/App.tsx";
import { ClaseProvider } from "../../src/components/ClaseProvider.tsx";
import { CLAVE_CLASE } from "../../src/services/almacen.ts";
import type { Clase } from "../../src/services/clase.ts";

export function almacenEnMemoria(inicial: Readonly<Record<string, string>> = {}): Storage {
  const datos = new Map(Object.entries(inicial));
  return {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
    clear: () => datos.clear(),
    key: () => null,
    get length() { return datos.size; },
  };
}

export function pintar(hash: string, clase: Clase, desbloqueado = false): string {
  vi.stubGlobal("localStorage", almacenEnMemoria({ [CLAVE_CLASE]: JSON.stringify(clase) }));
  return renderToString(<ClaseProvider desbloqueado={desbloqueado}><Vista hash={hash} /></ClaseProvider>);
}

export function pintarElemento(elemento: ReactElement): string {
  return renderToString(elemento);
}

export function texto(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ");
}
