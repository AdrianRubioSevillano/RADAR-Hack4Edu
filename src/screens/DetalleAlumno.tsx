import { Avatar } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { Semaforo, Titulo, Volver } from "../components/ui.tsx";
import { detalleDeAlumno } from "../services/clase.ts";
import { NOMBRE_AYUDA } from "../services/perfiles.ts";
import { enlace } from "../services/rutas.ts";

export function DetalleAlumnoPantalla({ alumnoId }: { alumnoId: string }) {
  const { clase } = useClase();
  const detalle = detalleDeAlumno(clase, alumnoId);
  const volver = enlace("profesor");
  if (detalle === null) {
    return (
      <div className="hoja">
        <Volver href={volver}>Mi clase</Volver>
        <Titulo>No encuentro a ese alumno.</Titulo>
      </div>
    );
  }
  const { alumno, tests, pendientes, practicas } = detalle;
  return (
    <div className="hoja">
      <Volver href={volver}>Mi clase</Volver>
      <div className="saludo">
        <Avatar index={alumno.avatar} size={84} />
        <div>
          <Titulo>{alumno.nombre}</Titulo>
          {alumno.ayudas.length > 0 && <p className="chips">{alumno.ayudas.map((a) => <span key={a} className="chip">{NOMBRE_AYUDA[a]}</span>)}</p>}
        </div>
      </div>

      {practicas.length > 0 && (
        <section className="nota-practica">
          <h2>Tiene ejercicios para practicar</h2>
          <ul>{practicas.map((p) => <li key={p.subhabilidad}>{p.nombre}{p.hechos > 0 ? `: lleva ${p.hechos} de 6` : ""}</li>)}</ul>
        </section>
      )}

      {tests.length === 0 && <p className="texto-grande">Aún no ha terminado ningún test.</p>}
      <div className="detalle-tests">
        {tests.map(({ test, habilidades }) => (
          <section className="detalle-test" key={test.id} aria-label={test.nombre}>
            <h2>{test.nombre}</h2>
            <ul>
              {habilidades.map((h) => (
                <li key={h.habilidad}><span>{h.nombre}</span> <Semaforo color={h.color} conTexto /></li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {pendientes.length > 0 && (
        <section>
          <h2>Le falta hacer</h2>
          <ul className="hechos">{pendientes.map(({ test }) => <li key={test.id}>{test.nombre}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
