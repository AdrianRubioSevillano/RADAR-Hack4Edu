import { Icon, Mascot } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { Titulo } from "../components/ui.tsx";
import { NOMBRE_BLOQUE } from "../content/temario.ts";
import { alumnoPorId, practicasPendientes, testsDeAlumno } from "../services/clase.ts";
import type { Presentacion } from "../services/perfiles.ts";
import { enlace } from "../services/rutas.ts";

export function MisTests({ alumnoId, presentacion }: { alumnoId: string; presentacion: Presentacion }) {
  const { clase } = useClase();
  const alumno = alumnoPorId(clase, alumnoId);
  if (alumno === undefined) {
    return (
      <div className="hoja">
        <Titulo>No encuentro a ese alumno.</Titulo>
        <a className="boton boton-principal" href="#/alumno">Elegir mi nombre</a>
      </div>
    );
  }
  const tests = testsDeAlumno(clase, alumnoId);
  const porHacer = tests.filter((t) => t.estado !== "hecho");
  const hechos = tests.filter((t) => t.estado === "hecho");
  const practicas = practicasPendientes(clase, alumnoId);
  const nada = porHacer.length === 0 && practicas.length === 0;

  return (
    <div className="hoja">
      <div className="saludo">
        {!presentacion.sinExtras && <Mascot mood={nada ? "cheer" : "hello"} size={96} />}
        <Titulo>{nada ? `¡Todo hecho, ${alumno.nombre}!` : `Hola, ${alumno.nombre}`}</Titulo>
      </div>

      {practicas.length > 0 && (
        <section aria-labelledby="practica-titulo">
          <h2 id="practica-titulo">Tus ejercicios para practicar</h2>
          <ul className="tarjetas">
            {practicas.map((p) => (
              <li key={p.subhabilidad}>
                <a className="tarjeta tarjeta-practica" href={enlace("alumno", alumnoId, "practica", p.testId, p.subhabilidad)}>
                  <span className="tarjeta-icono"><Icon name="practice" size={32} /></span>
                  <span className="tarjeta-texto"><strong>{p.nombre}</strong><span>{p.hechos > 0 ? `Llevas ${p.hechos} de 6` : "6 ejercicios y un reto"}</span></span>
                  <Icon name="arrow" size={30} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {porHacer.length > 0 && (
        <section aria-labelledby="tests-titulo">
          <h2 id="tests-titulo">Tests para hacer</h2>
          <ul className="tarjetas">
            {porHacer.map(({ test, estado, respondidas }) => (
              <li key={test.id}>
                <a className="tarjeta" href={enlace("alumno", alumnoId, "test", test.id)}>
                  <span className="tarjeta-icono"><Icon name="star" size={32} /></span>
                  <span className="tarjeta-texto">
                    <strong>{test.nombre}</strong>
                    <span>{estado === "enCurso" ? `Sigue por la pregunta ${respondidas + 1}` : NOMBRE_BLOQUE[test.bloque]}</span>
                  </span>
                  <Icon name="arrow" size={30} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {nada && <p className="texto-grande">Hoy no tienes nada pendiente.</p>}

      {hechos.length > 0 && (
        <section aria-labelledby="hechos-titulo">
          <h2 id="hechos-titulo">Ya hechos</h2>
          <ul className="hechos">
            {hechos.map(({ test }) => (
              <li key={test.id}><Icon name="check" /> {test.nombre}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
