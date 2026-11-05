import logo from "../assets/radar-logo.png";
import { Avatar, Icon, Mascot } from "../components/art.tsx";

export function Inicio() {
  return (
    <div className="inicio">
      <div className="inicio-anillos" aria-hidden="true"><span /><span /><span /><span /></div>
      <section className="inicio-portada">
        <img className="inicio-logo" src={logo} alt="RADAR" width="300" height="270" />
        <h1 id="titulo" tabIndex={-1}>Descubre qué le cuesta a cada alumno, y practica justo eso.</h1>
        <p>Para primaria. Funciona sin internet y se adapta a alumnos con dislexia, TDAH, baja visión o discapacidad auditiva.</p>
      </section>
      <nav className="inicio-puertas" aria-label="¿Quién eres?">
        <a className="puerta puerta-alumno" href="#/alumno">
          <span className="puerta-dibujo" aria-hidden="true"><Mascot mood="cheer" size={120} /></span>
          <span className="puerta-texto">Soy alumno</span>
          <Icon name="arrow" size={36} />
        </a>
        <a className="puerta puerta-profesor" href="#/profesor">
          <span className="puerta-dibujo" aria-hidden="true"><Avatar index={6} size={104} /></span>
          <span className="puerta-texto">Soy profesor</span>
          <Icon name="arrow" size={36} />
        </a>
      </nav>
      <a className="inicio-acerca" href="#/acerca">Acerca de RADAR</a>
    </div>
  );
}
