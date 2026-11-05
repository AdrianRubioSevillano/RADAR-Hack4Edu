import { Avatar, Mascot } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { useIdioma } from "../components/IdiomaProvider.tsx";
import { Semaforo } from "../components/ui.tsx";
import { nombreHabilidad, nombreSub, nombreTest, temaDeSub } from "../i18n/nombres.ts";
import { testPorId } from "../content/tests.ts";
import { alumnoPorId, cuadriculaDe, recomendacionDe, type Alumno } from "../services/clase.ts";
import { enlace } from "../services/rutas.ts";
import type { Recomendacion } from "../core/recomendacion.ts";

function Manana({ r }: { r: Recomendacion }) {
  const { t } = useIdioma();
  if (r.evaluados === 0) {
    return (
      <section className="manana manana-calma">
        <Mascot mood="think" size={110} />
        <div>
          <h1 id="titulo" tabIndex={-1}>{t("clase.sinResultados")}</h1>
          <p>{t("clase.sinResultadosTexto")}</p>
        </div>
      </section>
    );
  }
  if (r.subhabilidad === null) {
    return (
      <section className="manana manana-calma">
        <Mascot mood="cheer" size={110} />
        <div>
          <h1 id="titulo" tabIndex={-1}>{t("clase.vaBien")}</h1>
          <p>{t("clase.vaBienTexto")}</p>
        </div>
      </section>
    );
  }
  return (
    <section className="manana">
      <div>
        <h1 id="titulo" tabIndex={-1}><span className="manana-rotulo">{t("clase.manana")}</span> <span className="manana-tema">{nombreSub(t, r.subhabilidad)}</span></h1>
        <p>{t("clase.mananaTexto", { tema: temaDeSub(t, r.subhabilidad), rojos: r.rojos, evaluados: r.evaluados })}</p>
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
  const { t } = useIdioma();
  const r = recomendacionDe(clase);
  const { grupos, filas } = cuadriculaDe(clase);
  const de = (ids: readonly string[]) => ids.map((id) => alumnoPorId(clase, id));
  const nombreColumna = (testId: string, habilidad: number) => nombreHabilidad(t, testPorId(testId)?.habilidades[habilidad]?.id ?? "");
  const nombreGrupo = (testId: string) => { const test = testPorId(testId); return test === undefined ? testId : nombreTest(t, test); };

  return (
    <div className="hoja hoja-ancha">
      <Manana r={r} />

      {r.evaluados > 0 && (
        <section aria-labelledby="grupos-titulo">
          <h2 id="grupos-titulo">{t("clase.grupos")}</h2>
          <p className="grupos-nota">{t("clase.gruposNota")}</p>
          <div className="grupos">
            {r.grupos.map((g) => (
              <article className="grupo" key={g.subhabilidad}>
                <h3><Semaforo color="rojo" /> {nombreSub(t, g.subhabilidad)} <span className="grupo-cuenta">{g.alumnos.length}</span></h3>
                <Personas ids={g.alumnos} alumnos={de(g.alumnos)} />
              </article>
            ))}
            {r.sinRojos.length > 0 && (
              <article className="grupo grupo-bien">
                <h3><Semaforo color="verde" /> {t("clase.vanBien")} <span className="grupo-cuenta">{r.sinRojos.length}</span></h3>
                <Personas ids={r.sinRojos} alumnos={de(r.sinRojos)} />
              </article>
            )}
            {r.sinRespuestas.length > 0 && (
              <article className="grupo grupo-espera">
                <h3>{t("clase.sinTest")} <span className="grupo-cuenta">{r.sinRespuestas.length}</span></h3>
                <Personas ids={r.sinRespuestas} alumnos={de(r.sinRespuestas)} />
              </article>
            )}
          </div>
        </section>
      )}

      {grupos.length > 0 && (
        <section aria-labelledby="cuadricula-titulo">
          <div className="cabecera-seccion">
            <h2 id="cuadricula-titulo">{t("clase.toda")}</h2>
            <ul className="leyenda">
              {(["verde", "amarillo", "rojo"] as const).map((c) => <li key={c}><Semaforo color={c} /> {t(`semaforo.${c}`)}</li>)}
            </ul>
          </div>
          <div className="cuadricula-marco" tabIndex={0} role="region" aria-label={t("clase.cuadricula")}>
            <table className="cuadricula">
              <thead>
                <tr>
                  <td />
                  {grupos.map((g) => <th key={g.testId} scope="colgroup" colSpan={g.columnas.length} className="cuadricula-test">{nombreGrupo(g.testId)}</th>)}
                </tr>
                <tr>
                  <th scope="col" className="cuadricula-alumno-th">{t("clase.alumno")}</th>
                  {grupos.flatMap((g) => g.columnas).map((c) => <th key={`${c.testId}-${c.habilidad}`} scope="col" className="cuadricula-col"><span>{nombreColumna(c.testId, c.habilidad)}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {filas.map(({ alumno, celdas }) => (
                  <tr key={alumno.id}>
                    <th scope="row"><a href={enlace("profesor", "alumno", alumno.id)}><Avatar index={alumno.avatar} size={32} /> {alumno.nombre}</a></th>
                    {celdas.map((color, i) => (
                      <td key={i}>{color === null ? <span className="celda-vacia"><span aria-hidden="true">·</span><span className="sr-only">{t("clase.sinHacer")}</span></span> : <Semaforo color={color} />}</td>
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
