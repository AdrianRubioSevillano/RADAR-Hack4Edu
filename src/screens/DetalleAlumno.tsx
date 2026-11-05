import { Avatar } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { useIdioma } from "../components/IdiomaProvider.tsx";
import { Semaforo, Titulo, Volver } from "../components/ui.tsx";
import { nombreHabilidad, nombreSub, nombreTest } from "../i18n/nombres.ts";
import { detalleDeAlumno } from "../services/clase.ts";
import { enlace } from "../services/rutas.ts";

export function DetalleAlumnoPantalla({ alumnoId }: { alumnoId: string }) {
  const { clase } = useClase();
  const { t } = useIdioma();
  const detalle = detalleDeAlumno(clase, alumnoId);
  const volver = enlace("profesor");
  if (detalle === null) {
    return (
      <div className="hoja">
        <Volver href={volver}>{t("nav.miClase")}</Volver>
        <Titulo>{t("detalle.noEncontrado")}</Titulo>
      </div>
    );
  }
  const { alumno, tests, pendientes, practicas } = detalle;
  return (
    <div className="hoja">
      <Volver href={volver}>{t("nav.miClase")}</Volver>
      <div className="saludo">
        <Avatar index={alumno.avatar} size={84} />
        <div>
          <Titulo>{alumno.nombre}</Titulo>
          {alumno.ayudas.length > 0 && <p className="chips">{alumno.ayudas.map((a) => <span key={a} className="chip">{t(`ayuda.${a}`)}</span>)}</p>}
        </div>
      </div>

      {practicas.length > 0 && (
        <section className="nota-practica">
          <h2>{t("detalle.tienePractica")}</h2>
          <ul>{practicas.map((p) => <li key={p.subhabilidad}>{nombreSub(t, p.subhabilidad)}{p.hechos > 0 ? `: ${t("detalle.lleva", { n: p.hechos })}` : ""}</li>)}</ul>
        </section>
      )}

      {tests.length === 0 && <p className="texto-grande">{t("detalle.sinTests")}</p>}
      <div className="detalle-tests">
        {tests.map(({ test, habilidades }) => (
          <section className="detalle-test" key={test.id} aria-label={nombreTest(t, test)}>
            <h2>{nombreTest(t, test)}</h2>
            <ul>
              {habilidades.map((h) => (
                <li key={h.habilidad}><span>{nombreHabilidad(t, test.habilidades[h.habilidad]?.id ?? "")}</span> <Semaforo color={h.color} conTexto /></li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {pendientes.length > 0 && (
        <section>
          <h2>{t("detalle.falta")}</h2>
          <ul className="hechos">{pendientes.map(({ test }) => <li key={test.id}>{nombreTest(t, test)}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
