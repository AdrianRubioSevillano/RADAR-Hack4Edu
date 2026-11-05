import { Mascot } from "../components/art.tsx";
import { Titulo, Volver } from "../components/ui.tsx";

export function Acerca() {
  return (
    <div className="hoja hoja-estrecha">
      <Volver href="#/">Inicio</Volver>
      <div className="acerca-cabecera">
        <Mascot mood="hello" size={110} />
        <Titulo>Acerca de RADAR</Titulo>
      </div>
      <p>RADAR detecta qué parte de cada tema le cuesta a cada alumno de primaria y le da ejercicios para esa parte. Funciona sin internet y se adapta a alumnos con dislexia, TDAH, baja visión o discapacidad auditiva.</p>
      <h2>Una nota honesta</h2>
      <p>RADAR da una orientación para el docente, no una nota ni un diagnóstico. Sus ajustes aún no se han comprobado con alumnos reales, y el temario es una propuesta internacional, no el currículo oficial de un país. El PIN protege la tablet de forma sencilla, pero no es seguridad fuerte. Todo se guarda solo en este dispositivo.</p>
      <p>Creado para Hack4Edu 2026.</p>
    </div>
  );
}
