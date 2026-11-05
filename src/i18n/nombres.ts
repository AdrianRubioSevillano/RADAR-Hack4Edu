// Nombres del temario en el idioma elegido. Los servicios siguen trabajando con ids.
import type { DefinicionTest } from "../content/tests.ts";
import { subhabilidadPorId } from "../content/temario.ts";
import { esClave, type Traductor } from "./index.ts";

function porClave(t: Traductor, clave: string, id: string): string {
  return esClave(clave) ? t(clave) : id;
}

export function nombreTema(t: Traductor, id: string): string {
  return porClave(t, `tema.${id}`, id);
}

export function nombreSub(t: Traductor, id: string): string {
  return porClave(t, `sub.${id}`, id);
}

export function temaDeSub(t: Traductor, id: string): string {
  return nombreTema(t, subhabilidadPorId(id)?.tema ?? "");
}

// En un test de tema las habilidades son subhabilidades; en uno mezclado, temas.
export function nombreHabilidad(t: Traductor, id: string): string {
  return subhabilidadPorId(id) === undefined ? nombreTema(t, id) : nombreSub(t, id);
}

export function nombreTest(t: Traductor, test: DefinicionTest): string {
  if (test.tipo === "repaso") return t("test.repaso");
  if (test.tipo === "final") return t("test.final");
  return nombreTema(t, test.id);
}
