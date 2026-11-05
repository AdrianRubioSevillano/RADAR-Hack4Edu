import logo from "../assets/radar-logo.png";
import { Avatar, Icon, Mascot } from "../components/art.tsx";
import { useIdioma } from "../components/IdiomaProvider.tsx";
import { AvisoRevision, SelectorIdioma } from "../components/SelectorIdioma.tsx";

export function Inicio() {
  const { t } = useIdioma();
  return (
    <div className="inicio">
      <div className="inicio-anillos" aria-hidden="true"><span /><span /><span /><span /></div>
      <SelectorIdioma />
      <section className="inicio-portada">
        <img className="inicio-logo" src={logo} alt="RADAR" width="300" height="270" />
        <h1 id="titulo" tabIndex={-1}>{t("inicio.titulo")}</h1>
        <p>{t("inicio.texto")}</p>
        <AvisoRevision />
      </section>
      <nav className="inicio-puertas" aria-label={t("inicio.quien")}>
        <a className="puerta puerta-alumno" href="#/alumno">
          <span className="puerta-dibujo" aria-hidden="true"><Mascot mood="cheer" size={120} /></span>
          <span className="puerta-texto">{t("inicio.alumno")}</span>
          <Icon name="arrow" size={36} />
        </a>
        <a className="puerta puerta-profesor" href="#/profesor">
          <span className="puerta-dibujo" aria-hidden="true"><Avatar index={6} size={104} /></span>
          <span className="puerta-texto">{t("inicio.profesor")}</span>
          <Icon name="arrow" size={36} />
        </a>
      </nav>
      <a className="inicio-acerca" href="#/acerca">{t("inicio.acerca")}</a>
    </div>
  );
}
