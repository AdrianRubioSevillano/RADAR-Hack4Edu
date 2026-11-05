import { Icon, Mascot } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { useIdioma } from "../components/IdiomaProvider.tsx";
import { Titulo } from "../components/ui.tsx";
import { nombreSub, nombreTest } from "../i18n/nombres.ts";
import { alumnoPorId, practicasPendientes, testsDeAlumno } from "../services/clase.ts";
import type { Presentacion } from "../services/perfiles.ts";
import { enlace } from "../services/rutas.ts";

export function MisTests({ alumnoId, presentacion }: { alumnoId: string; presentacion: Presentacion }) {
  const { clase } = useClase();
  const { t } = useIdioma();
  const alumno = alumnoPorId(clase, alumnoId);
  if (alumno === undefined) {
    return (
      <div className="hoja">
        <Titulo>{t("detalle.noEncontrado")}</Titulo>
        <a className="boton boton-principal" href="#/alumno">{t("alumno.elegirNombre")}</a>
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
        <Titulo>{t(nada ? "alumno.todoHecho" : "alumno.hola", { nombre: alumno.nombre })}</Titulo>
      </div>

      {practicas.length > 0 && (
        <section aria-labelledby="practica-titulo">
          <h2 id="practica-titulo">{t("alumno.practicas")}</h2>
          <ul className="tarjetas">
            {practicas.map((p) => (
              <li key={p.subhabilidad}>
                <a className="tarjeta tarjeta-practica" href={enlace("alumno", alumnoId, "practica", p.testId, p.subhabilidad)}>
                  <span className="tarjeta-icono"><Icon name="practice" size={32} /></span>
                  <span className="tarjeta-texto"><strong>{nombreSub(t, p.subhabilidad)}</strong><span>{p.hechos > 0 ? t("alumno.llevas", { n: p.hechos }) : t("alumno.seisEjercicios")}</span></span>
                  <Icon name="arrow" size={30} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {porHacer.length > 0 && (
        <section aria-labelledby="tests-titulo">
          <h2 id="tests-titulo">{t("alumno.tests")}</h2>
          <ul className="tarjetas">
            {porHacer.map(({ test, estado, respondidas }) => (
              <li key={test.id}>
                <a className="tarjeta" href={enlace("alumno", alumnoId, "test", test.id)}>
                  <span className="tarjeta-icono"><Icon name="star" size={32} /></span>
                  <span className="tarjeta-texto">
                    <strong>{nombreTest(t, test)}</strong>
                    <span>{estado === "enCurso" ? t("alumno.sigue", { n: respondidas + 1 }) : t(`bloque.${test.bloque}`)}</span>
                  </span>
                  <Icon name="arrow" size={30} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {nada && <p className="texto-grande">{t("alumno.nada")}</p>}

      {hechos.length > 0 && (
        <section aria-labelledby="hechos-titulo">
          <h2 id="hechos-titulo">{t("alumno.hechos")}</h2>
          <ul className="hechos">
            {hechos.map(({ test }) => (
              <li key={test.id}><Icon name="check" /> {nombreTest(t, test)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
