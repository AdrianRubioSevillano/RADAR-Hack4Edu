import { Avatar, Mascot } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { useIdioma } from "../components/IdiomaProvider.tsx";
import { SelectorIdiomaCompacto } from "../components/SelectorIdioma.tsx";
import { Titulo, Volver } from "../components/ui.tsx";
import { enlace } from "../services/rutas.ts";

export function ElegirAlumno() {
  const { clase } = useClase();
  const { t } = useIdioma();
  return (
    <div className="hoja">
      <div className="fila-volver">
        <Volver href="#/">{t("nav.inicio")}</Volver>
        <SelectorIdiomaCompacto />
      </div>
      <div className="saludo">
        <Mascot mood="hello" size={96} />
        <Titulo>{t("alumno.quien")}</Titulo>
      </div>
      {clase.alumnos.length === 0 ? (
        <p>{t("alumno.sinAlumnos")}</p>
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
