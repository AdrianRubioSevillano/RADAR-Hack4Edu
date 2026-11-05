import { useState, type FormEvent } from "react";
import { Avatar } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { useIdioma } from "../components/IdiomaProvider.tsx";
import { ConfirmButton, Titulo } from "../components/ui.tsx";
import { BLOQUES, CURSOS } from "../content/temario.ts";
import { testsDe } from "../content/tests.ts";
import type { Curso } from "../content/tipos.ts";
import { AYUDAS, alternarAsignacion, alternarAyuda, anadirAlumno, cambiarCurso, quitarAlumno } from "../services/clase.ts";
import { nombreTest } from "../i18n/nombres.ts";
import { comprobarPin, hashPin, pinValido } from "../services/pin.ts";

function CambiarPin() {
  const { clase, actualizar } = useClase();
  const { t } = useIdioma();
  const [actual, setActual] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!pinValido(nuevo)) {
      setMensaje(t("ajustes.pinInvalido"));
    } else if (!(await comprobarPin(actual, clase.pinHash))) {
      setMensaje(t("ajustes.pinMal"));
    } else {
      const hash = await hashPin(nuevo);
      actualizar((c) => ({ ...c, pinHash: hash }));
      setActual("");
      setNuevo("");
      setMensaje(t("ajustes.pinCambiado"));
    }
  };
  return (
    <form className="fila-pin" onSubmit={(e) => void enviar(e)}>
      <label>{t("ajustes.pinActual")}<input type="password" inputMode="numeric" maxLength={4} autoComplete="off" value={actual} onChange={(e) => setActual(e.target.value)} /></label>
      <label>{t("ajustes.pinNuevo")}<input type="password" inputMode="numeric" maxLength={4} autoComplete="off" value={nuevo} onChange={(e) => setNuevo(e.target.value)} /></label>
      <button type="submit" className="boton boton-suave">{t("ajustes.pinCambiar")}</button>
      {mensaje !== null && <p role="status">{mensaje}</p>}
    </form>
  );
}

export function Ajustes() {
  const { clase, actualizar, restablecer } = useClase();
  const { t } = useIdioma();
  const [nombre, setNombre] = useState("");
  const tests = testsDe(clase.curso);

  return (
    <div className="hoja">
      <Titulo>{t("nav.ajustes")}</Titulo>

      <section className="ajuste" aria-labelledby="ajuste-curso">
        <h2 id="ajuste-curso">{t("ajustes.nivel")}</h2>
        <label className="campo">
          <span className="sr-only">{t("ajustes.nivelCorto")}</span>
          <select value={clase.curso} onChange={(e) => actualizar((c) => cambiarCurso(c, Number(e.target.value) as Curso))}>
            {CURSOS.map((c) => <option key={c} value={c}>{t(`nivel.${c}`)}</option>)}
          </select>
        </label>
      </section>

      <section className="ajuste" aria-labelledby="ajuste-tests">
        <h2 id="ajuste-tests">{t("ajustes.tests")}</h2>
        <p>{t("ajustes.testsTexto")}</p>
        <div className="bloques">
          {BLOQUES.map((bloque) => (
            <fieldset key={bloque} className="bloque">
              <legend>{t(`bloque.${bloque}`)}</legend>
              {tests.filter((test) => test.bloque === bloque).map((test) => (
                <label key={test.id} className="casilla">
                  <input type="checkbox" checked={clase.asignados.includes(test.id)} onChange={() => actualizar((c) => alternarAsignacion(c, test.id))} />
                  <span>{nombreTest(t, test)}</span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      </section>

      <section className="ajuste" aria-labelledby="ajuste-alumnos">
        <h2 id="ajuste-alumnos">{t("ajustes.alumnos")}</h2>
        <p>{t("ajustes.alumnosTexto")}</p>
        <ul className="ayudas-leyenda">
          {AYUDAS.map((a) => <li key={a}><strong>{t(`ayuda.${a}`)}:</strong> {t(`ayudaTexto.${a}`)}</li>)}
        </ul>
        <ul className="alumnos-lista">
          {clase.alumnos.map((a) => (
            <li key={a.id}>
              <fieldset>
                <legend><Avatar index={a.avatar} size={40} /> {a.nombre}</legend>
                <div className="alumnos-ayudas">
                  {AYUDAS.map((ayuda) => (
                    <label key={ayuda} className="casilla casilla-compacta">
                      <input type="checkbox" checked={a.ayudas.includes(ayuda)} onChange={() => actualizar((c) => alternarAyuda(c, a.id, ayuda))} />
                      <span>{t(`ayuda.${ayuda}`)}</span>
                    </label>
                  ))}
                  <ConfirmButton className="boton boton-suave boton-pequeno" label={t("ajustes.quitar")} confirmLabel={t("ajustes.quitarConfirma", { nombre: a.nombre })} onConfirm={() => actualizar((c) => quitarAlumno(c, a.id))} />
                </div>
              </fieldset>
            </li>
          ))}
        </ul>
        <form
          className="anadir"
          onSubmit={(e) => {
            e.preventDefault();
            actualizar((c) => anadirAlumno(c, nombre));
            setNombre("");
          }}
        >
          <label className="campo">{t("ajustes.nombreAlumno")}<input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" /></label>
          <button type="submit" className="boton boton-principal" disabled={nombre.trim() === ""}>{t("ajustes.anadir")}</button>
        </form>
      </section>

      <section className="ajuste" aria-labelledby="ajuste-pin">
        <h2 id="ajuste-pin">{t("ajustes.pin")}</h2>
        <CambiarPin />
      </section>

      <section className="ajuste" aria-labelledby="ajuste-demo">
        <h2 id="ajuste-demo">{t("ajustes.demo")}</h2>
        <p>{t("ajustes.demoTexto")}</p>
        <ConfirmButton label={t("ajustes.demoBoton")} confirmLabel={t("ajustes.demoConfirma")} onConfirm={restablecer} />
      </section>
    </div>
  );
}
