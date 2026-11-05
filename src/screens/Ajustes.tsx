import { useState, type FormEvent } from "react";
import { Avatar } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { ConfirmButton, Titulo } from "../components/ui.tsx";
import { BLOQUES, CURSOS, NOMBRE_BLOQUE, NOMBRE_NIVEL } from "../content/temario.ts";
import { testsDe } from "../content/tests.ts";
import type { Curso } from "../content/tipos.ts";
import { AYUDAS, alternarAsignacion, alternarAyuda, anadirAlumno, cambiarCurso, quitarAlumno } from "../services/clase.ts";
import { ETIQUETA_AYUDA, NOMBRE_AYUDA } from "../services/perfiles.ts";
import { comprobarPin, hashPin, pinValido } from "../services/pin.ts";

function CambiarPin() {
  const { clase, actualizar } = useClase();
  const [actual, setActual] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!pinValido(nuevo)) {
      setMensaje("El PIN nuevo debe tener 4 números.");
    } else if (!(await comprobarPin(actual, clase.pinHash))) {
      setMensaje("El PIN actual no es correcto.");
    } else {
      const hash = await hashPin(nuevo);
      actualizar((c) => ({ ...c, pinHash: hash }));
      setActual("");
      setNuevo("");
      setMensaje("PIN cambiado.");
    }
  };
  return (
    <form className="fila-pin" onSubmit={(e) => void enviar(e)}>
      <label>PIN actual<input type="password" inputMode="numeric" maxLength={4} autoComplete="off" value={actual} onChange={(e) => setActual(e.target.value)} /></label>
      <label>PIN nuevo<input type="password" inputMode="numeric" maxLength={4} autoComplete="off" value={nuevo} onChange={(e) => setNuevo(e.target.value)} /></label>
      <button type="submit" className="boton boton-suave">Cambiar PIN</button>
      {mensaje !== null && <p role="status">{mensaje}</p>}
    </form>
  );
}

export function Ajustes() {
  const { clase, actualizar, restablecer } = useClase();
  const [nombre, setNombre] = useState("");
  const tests = testsDe(clase.curso);

  return (
    <div className="hoja">
      <Titulo>Ajustes</Titulo>

      <section className="ajuste" aria-labelledby="ajuste-curso">
        <h2 id="ajuste-curso">Nivel de la clase</h2>
        <label className="campo">
          <span className="sr-only">Nivel</span>
          <select value={clase.curso} onChange={(e) => actualizar((c) => cambiarCurso(c, Number(e.target.value) as Curso))}>
            {CURSOS.map((c) => <option key={c} value={c}>{NOMBRE_NIVEL[c]}</option>)}
          </select>
        </label>
      </section>

      <section className="ajuste" aria-labelledby="ajuste-tests">
        <h2 id="ajuste-tests">Tests para la clase</h2>
        <p>Marca los temas que ya habéis trabajado. Toda la clase los verá.</p>
        <div className="bloques">
          {BLOQUES.map((bloque) => (
            <fieldset key={bloque} className="bloque">
              <legend>{NOMBRE_BLOQUE[bloque]}</legend>
              {tests.filter((t) => t.bloque === bloque).map((t) => (
                <label key={t.id} className="casilla">
                  <input type="checkbox" checked={clase.asignados.includes(t.id)} onChange={() => actualizar((c) => alternarAsignacion(c, t.id))} />
                  <span>{t.nombre}</span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      </section>

      <section className="ajuste" aria-labelledby="ajuste-alumnos">
        <h2 id="ajuste-alumnos">Alumnos y ayudas</h2>
        <p>Activa las ayudas que necesita cada alumno. Solo se guardan las ayudas, nunca un diagnóstico.</p>
        <ul className="ayudas-leyenda">
          {AYUDAS.map((a) => <li key={a}><strong>{NOMBRE_AYUDA[a]}:</strong> {ETIQUETA_AYUDA[a]}</li>)}
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
                      <span>{NOMBRE_AYUDA[ayuda]}</span>
                    </label>
                  ))}
                  <ConfirmButton className="boton boton-suave boton-pequeno" label="Quitar" confirmLabel={`¿Quitar a ${a.nombre}?`} onConfirm={() => actualizar((c) => quitarAlumno(c, a.id))} />
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
          <label className="campo">Nombre del alumno<input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" /></label>
          <button type="submit" className="boton boton-principal" disabled={nombre.trim() === ""}>Añadir alumno</button>
        </form>
      </section>

      <section className="ajuste" aria-labelledby="ajuste-pin">
        <h2 id="ajuste-pin">PIN</h2>
        <CambiarPin />
      </section>

      <section className="ajuste" aria-labelledby="ajuste-demo">
        <h2 id="ajuste-demo">Demo</h2>
        <p>Vuelve a la clase de ejemplo. Se borran los cambios, pero se conserva tu PIN.</p>
        <ConfirmButton label="Restablecer demo" confirmLabel="Sí, restablecer" onConfirm={restablecer} />
      </section>
    </div>
  );
}
