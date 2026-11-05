import { Avatar, Mascot } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { ETIQUETA_COLOR, Semaforo } from "../components/ui.tsx";
import { alumnoPorId, cuadriculaDe, nombreSubhabilidad, recomendacionDe, type Alumno } from "../services/clase.ts";
import { enlace } from "../services/rutas.ts";
import type { Recomendacion } from "../core/recomendacion.ts";

function Manana({ r }: { r: Recomendacion }) {
  if (r.evaluados === 0) {
    return (
      <section className="manana manana-calma">
        <Mascot mood="think" size={110} />
        <div>
          <h1 id="titulo" tabIndex={-1}>Aún no hay resultados</h1>
          <p>Cuando tus alumnos hagan un test, aquí verás qué explicar primero.</p>
        </div>
      </section>
    );
  }
  if (r.subhabilidad === null) {
    return (
      <section className="manana manana-calma">
        <Mascot mood="cheer" size={110} />
        <div>
          <h1 id="titulo" tabIndex={-1}>Tu clase va bien</h1>
          <p>Ningún alumno necesita refuerzo ahora mismo.</p>
        </div>
      </section>
    );
  }
  const { nombre, tema } = nombreSubhabilidad(r.subhabilidad);
  return (
    <section className="manana">
      <div>
        <h1 id="titulo" tabIndex={-1}><span className="manana-rotulo">Mañana explica primero:</span> <span className="manana-tema">{nombre}</span></h1>
        <p>Del tema {tema}. Lo necesitan {r.rojos} de los {r.evaluados} alumnos que han hecho tests.</p>
      </div>
      <Mascot mood="hello" size={120} />
    </section>
  );
}

function Personas({ ids, alumnos }: { ids: readonly string[]; alumnos: readonly (Alumno | undefined)[] }) {
  return (
    <ul className="personas">
      {alumnos.map((a, i) =>
        a === undefined ? null : (
          <li key={ids[i]}>
            <a href={enlace("profesor", "alumno", a.id)}><Avatar index={a.avatar} size={36} /> {a.nombre}</a>
          </li>
        ),
      )}
    </ul>
  );
}

export function MiClase() {
  const { clase } = useClase();
  const r = recomendacionDe(clase);
  const { grupos, filas } = cuadriculaDe(clase);
  const de = (ids: readonly string[]) => ids.map((id) => alumnoPorId(clase, id));

  return (
    <div className="hoja hoja-ancha">
      <Manana r={r} />

      {r.evaluados > 0 && (
        <section aria-labelledby="grupos-titulo">
          <h2 id="grupos-titulo">Grupos para trabajar</h2>
          <p className="grupos-nota">Cada alumno aparece en el grupo de lo que más necesita.</p>
          <div className="grupos">
            {r.grupos.map((g) => (
              <article className="grupo" key={g.subhabilidad}>
                <h3><Semaforo color="rojo" /> {nombreSubhabilidad(g.subhabilidad).nombre} <span className="grupo-cuenta">{g.alumnos.length}</span></h3>
                <Personas ids={g.alumnos} alumnos={de(g.alumnos)} />
              </article>
            ))}
            {r.sinRojos.length > 0 && (
              <article className="grupo grupo-bien">
                <h3><Semaforo color="verde" /> Van bien <span className="grupo-cuenta">{r.sinRojos.length}</span></h3>
                <Personas ids={r.sinRojos} alumnos={de(r.sinRojos)} />
              </article>
            )}
            {r.sinRespuestas.length > 0 && (
              <article className="grupo grupo-espera">
                <h3>Aún sin hacer ningún test <span className="grupo-cuenta">{r.sinRespuestas.length}</span></h3>
                <Personas ids={r.sinRespuestas} alumnos={de(r.sinRespuestas)} />
              </article>
            )}
          </div>
        </section>
      )}

      {grupos.length > 0 && (
        <section aria-labelledby="cuadricula-titulo">
          <div className="cabecera-seccion">
            <h2 id="cuadricula-titulo">Toda la clase</h2>
            <ul className="leyenda">
              {(["verde", "amarillo", "rojo"] as const).map((c) => <li key={c}><Semaforo color={c} /> {ETIQUETA_COLOR[c]}</li>)}
            </ul>
          </div>
          <div className="cuadricula-marco" tabIndex={0} role="region" aria-label="Cuadrícula de alumnos y temas, con desplazamiento">
            <table className="cuadricula">
              <thead>
                <tr>
                  <td />
                  {grupos.map((g) => <th key={g.testId} scope="colgroup" colSpan={g.columnas.length} className="cuadricula-test">{g.nombre}</th>)}
                </tr>
                <tr>
                  <th scope="col" className="cuadricula-alumno-th">Alumno</th>
                  {grupos.flatMap((g) => g.columnas).map((c) => <th key={`${c.testId}-${c.habilidad}`} scope="col" className="cuadricula-col"><span>{c.nombre}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {filas.map(({ alumno, celdas }) => (
                  <tr key={alumno.id}>
                    <th scope="row"><a href={enlace("profesor", "alumno", alumno.id)}><Avatar index={alumno.avatar} size={32} /> {alumno.nombre}</a></th>
                    {celdas.map((color, i) => (
                      <td key={i}>{color === null ? <span className="celda-vacia"><span aria-hidden="true">·</span><span className="sr-only">Sin hacer</span></span> : <Semaforo color={color} />}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
