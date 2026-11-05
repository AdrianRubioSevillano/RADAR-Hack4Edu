import { Avatar, Mascot } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { Titulo, Volver } from "../components/ui.tsx";
import { enlace } from "../services/rutas.ts";

export function ElegirAlumno() {
  const { clase } = useClase();
  return (
    <div className="hoja">
      <Volver href="#/">Inicio</Volver>
      <div className="saludo">
        <Mascot mood="hello" size={96} />
        <Titulo>¿Quién eres?</Titulo>
      </div>
      {clase.alumnos.length === 0 ? (
        <p>Tu profe aún no ha añadido alumnos.</p>
      ) : (
        <ul className="nombres">
          {clase.alumnos.map((a) => (
            <li key={a.id}>
              <a className="nombre" href={enlace("alumno", a.id)}>
                <Avatar index={a.avatar} size={64} />
                <span>{a.nombre}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
